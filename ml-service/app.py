import os
import re
import json
import logging
import threading
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/ds-engine-osys")
DB_NAME = "ds-engine-osys"

# Thread-safe ML running status flag
_ml_lock = threading.Lock()
_ml_is_running = False

# Cached last ML result so UI always has data even between runs
_cached_rankings = None
_cached_offers = None

def set_ml_running(state: bool):
    global _ml_is_running
    with _ml_lock:
        _ml_is_running = state

def get_ml_running() -> bool:
    with _ml_lock:
        return _ml_is_running

def run_ml_pipeline_background():
    """Run full ML training + ranking + offer generation, cache results."""
    global _cached_rankings, _cached_offers
    try:
        set_ml_running(True)
        app.logger.info("[ML Background] Training ML model...")
        model, ranked_df, records = train_supervised_ranking_model()
        if ranked_df is None or ranked_df.empty:
            app.logger.warning("[ML Background] No data found for training.")
            return

        products_meta = {p["productId"]: p for p in fetch_products_metadata()}
        all_products = fetch_products_metadata()
        meta_dict = {p["productId"]: p for p in all_products}
        other_product_options = [
            {"productId": p["productId"], "productName": p["productName"], "price": p.get("sellingPrice", 0)}
            for p in all_products
        ]

        rankings_result = []
        offers_result = []

        for _, row in ranked_df.iterrows():
            p_id = row["productId"]
            meta = products_meta.get(p_id, {})
            score = float(row["ml_score"])

            if score >= 70:
                level = "HIGH"
                recommendation = "High demand item - Maintain stock and pricing"
            elif score >= 40:
                level = "MID"
                recommendation = "Moderate sales velocity - Consider 0-100% discount or combine selling"
            else:
                level = "LOW"
                recommendation = "Low performance level - Immediate offer intervention recommended"

            rankings_result.append({
                "productId": p_id,
                "productName": row["productName"],
                "category": meta.get("category", "Cosmetics"),
                "subCategory": meta.get("subCategory", ""),
                "rank": int(row["rank"]),
                "score": score,
                "performanceLevel": level,
                "avgSellingTimePeriod": round(float(row["avg_selling_time"]), 1),
                "avgProfit": round(float(row["avg_profit"]), 2),
                "totalProfit": round(float(row["total_profit"]), 2),
                "avgOfferDiscount": round(float(row["avg_offer_discount"]), 1),
                "salesCount": int(row["sales_count"]),
                "mrp": float(meta.get("mrp", 0)),
                "sellingPrice": float(meta.get("sellingPrice", 0)),
                "imageUrl": meta.get("image") or meta.get("imageUrl") or "",
                "recommendation": recommendation
            })

            # Build offers
            if score >= 70:
                rec_priority = 1
            elif score >= 55:
                rec_priority = 1
            elif score >= 40:
                rec_priority = 2
            elif score >= 25:
                rec_priority = 3
            else:
                rec_priority = 4

            offers_result.append({
                "productId": p_id,
                "productName": row["productName"],
                "category": meta.get("category", "General"),
                "subCategory": meta.get("subCategory", ""),
                "mrp": float(meta.get("mrp", 0)),
                "sellingPrice": float(meta.get("sellingPrice", 0)),
                "imageUrl": meta.get("image") or meta.get("imageUrl") or "",
                "performanceScore": score,
                "performanceLevel": level,
                "recommendedPriority": rec_priority,
                "offers": [
                    {"priority": 4, "id": "bogo", "name": "BUY ONE GET ONE FREE", "isRecommended": rec_priority == 4, "type": "bogo"},
                    {"priority": 3, "id": "b2g1", "name": "BUY TWO GET ONE FREE", "isRecommended": rec_priority == 3, "type": "b2g1"},
                    {"priority": 2, "id": "combine_sell", "name": "Combine Selling (Bundle Product)", "isRecommended": rec_priority == 2, "type": "combine_sell",
                     "allowProductSelection": True, "availablePairProducts": [p for p in other_product_options if p["productId"] != p_id][:15]},
                    {"priority": 1, "id": "discount", "name": "0-100% Discount on Price", "isRecommended": rec_priority == 1, "type": "discount",
                     "defaultDiscountPercent": int(min(100, max(5, round(100 - score * 0.8))))}
                ]
            })

        with _ml_lock:
            _cached_rankings = {"totalProducts": len(rankings_result), "featureAttributes": ["SellingTimePeriod", "Profit", "OffersApplied"], "rankings": rankings_result}
            _cached_offers = {"totalProducts": len(offers_result), "prioritySequence": [4, 3, 2, 1], "productOffers": offers_result}

        app.logger.info(f"[ML Background] Done. Ranked {len(rankings_result)} products.")
        # Hold the running state for 5 minutes so the blinking indicator stays active
        import time as _time
        _time.sleep(300)
    except Exception as e:
        app.logger.error(f"[ML Background] Error: {e}")
    finally:
        set_ml_running(False)

def _background_scheduler(interval_seconds=300):
    """Continuously re-train and cache results in background cycles."""
    import time
    while True:
        if not get_ml_running():
            run_ml_pipeline_background()
        time.sleep(5)

def get_mongo_client():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        return client
    except Exception as e:
        app.logger.warning(f"Could not connect to MongoDB via URI {MONGO_URI}: {e}")
        return None

def parse_offer_discount(offer_str):
    if not offer_str or str(offer_str).strip() == "" or "No Offer" in str(offer_str):
        return 0.0
    match = re.search(r'(\d+)\s*%', str(offer_str))
    if match:
        return float(match.group(1))
    return 0.0

def fetch_product_performance_data():
    client = get_mongo_client()
    records = []
    
    if client:
        try:
            db = client[DB_NAME]
            cursor = db["productperformances"].find({})
            for doc in cursor:
                records.append({
                    "productId": doc.get("productId") or doc.get("ProductId"),
                    "productName": doc.get("productName") or doc.get("ProductName") or "Unknown Product",
                    "category": doc.get("category") or doc.get("Category") or "General",
                    "sellingTimePeriod": float(doc.get("sellingTimePeriod") or doc.get("SellingTimePeriod") or 0.0),
                    "profit": float(doc.get("profit") or doc.get("Profit") or 0.0),
                    "offersApplied": str(doc.get("offersApplied") or doc.get("OffersApplied") or "No Offer")
                })
        except Exception as e:
            app.logger.error(f"Error reading from MongoDB: {e}")
            
    # Fallback to backend data JSON if MongoDB is empty or unaccessible
    if not records:
        json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src", "data", "productperformance.json"))
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                for item in raw_data:
                    records.append({
                        "productId": item.get("ProductId"),
                        "productName": item.get("ProductName"),
                        "category": item.get("Category"),
                        "sellingTimePeriod": float(item.get("SellingTimePeriod") or 0.0),
                        "profit": float(item.get("Profit") or 0.0),
                        "offersApplied": str(item.get("OffersApplied") or "No Offer")
                    })
                    
    return records

def fetch_products_metadata():
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src", "data", "products.json"))
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def train_supervised_ranking_model():
    records = fetch_product_performance_data()
    if not records:
        return None, None, []

    df = pd.DataFrame(records)
    df["offerDiscountPercent"] = df["offersApplied"].apply(parse_offer_discount)

    # Group by productId to generate product-level aggregate statistics
    grouped = df.groupby(["productId", "productName"]).agg(
        avg_selling_time=("sellingTimePeriod", "mean"),
        avg_profit=("profit", "mean"),
        total_profit=("profit", "sum"),
        avg_offer_discount=("offerDiscountPercent", "mean"),
        sales_count=("sellingTimePeriod", "count")
    ).reset_index()

    if grouped.empty:
        return None, None, []

    # Calculate target synthetic score for supervised training based on domain metrics
    max_profit = max(grouped["avg_profit"].max(), 1.0)
    max_sales = max(grouped["sales_count"].max(), 1.0)
    max_time = max(grouped["avg_selling_time"].max(), 1.0)

    # Statistical ground truth formula: higher profit & sales, lower selling time period = higher score
    grouped["target_score"] = (
        (grouped["avg_profit"] / max_profit * 40.0) +
        (grouped["sales_count"] / max_sales * 40.0) +
        (100.0 - (grouped["avg_selling_time"] / max_time * 100.0)) * 0.20
    ).clip(0.0, 100.0)

    # Supervised ML features from productperformances: [SellingTimePeriod, Profit, OffersApplied] + aggregated counts
    X = grouped[["avg_selling_time", "avg_profit", "total_profit", "avg_offer_discount", "sales_count"]].values
    y = grouped["target_score"].values

    # Train Supervised RandomForestRegressor ML model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Predict scores using ML model
    predicted_scores = model.predict(X)
    grouped["ml_score"] = np.round(predicted_scores, 1)

    # Rank products descending by predicted ML score
    grouped = grouped.sort_values(by="ml_score", ascending=False).reset_index(drop=True)
    grouped["rank"] = grouped.index + 1

    return model, grouped, records

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Python Supervised Product Ranking ML Engine"})

@app.route('/api/ml/status', methods=['GET'])
def ml_status():
    """Returns whether the ML model is currently running/training."""
    return jsonify({"is_running": get_ml_running()})

@app.route('/api/ml/rankings', methods=['GET'])
def get_rankings():
    with _ml_lock:
        cached = _cached_rankings
    if cached is None:
        # Cache not ready yet — trigger a background run and ask client to retry
        if not get_ml_running():
            threading.Thread(target=run_ml_pipeline_background, daemon=True).start()
        return jsonify({"error": "ML model is warming up, please retry in a moment", "is_running": True}), 202
    return jsonify(cached)

@app.route('/api/ml/offers', methods=['GET'])
def get_offer_suggestions():
    with _ml_lock:
        cached = _cached_offers
    if cached is None:
        if not get_ml_running():
            threading.Thread(target=run_ml_pipeline_background, daemon=True).start()
        return jsonify({"error": "ML model is warming up, please retry in a moment", "is_running": True}), 202
    return jsonify(cached)

@app.route('/api/ml/run', methods=['POST'])
def trigger_ml_run():
    """Trigger an immediate ML run in background (called when user enters product page)."""
    if not get_ml_running():
        t = threading.Thread(target=run_ml_pipeline_background, daemon=True)
        t.start()
    return jsonify({"triggered": True, "is_running": get_ml_running()})

if __name__ == '__main__':
    # Start background ML scheduler: runs immediately on startup then every 5 minutes
    scheduler = threading.Thread(target=_background_scheduler, args=(300,), daemon=True)
    scheduler.start()
    app.logger.info("[ML] Background scheduler started — runs every 5 minutes.")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
