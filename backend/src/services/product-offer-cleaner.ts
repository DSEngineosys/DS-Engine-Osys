import Product from "../models/product.model";
import ProductPerformance from "../models/product-performance.model";
import path from "path";
import fs from "fs";

export async function checkAndCleanExpiredProductOffers() {
  try {
    const now = new Date();
    // Find all products where offerExpiresAt exists and offerExpiresAt <= now
    const expiredProducts = await Product.find({
      offerExpiresAt: { $exists: true, $ne: null, $lte: now }
    });

    if (!expiredProducts || expiredProducts.length === 0) {
      return;
    }

    for (const p of expiredProducts) {
      const offerName = p.activeOfferDetails?.offerName || `${p.offerPercentage || p.discountPercent || 0}% OFF`;
      const durationMins = p.offerDurationMinutes || 60;
      const appliedAt = p.offerAppliedAt ? new Date(p.offerAppliedAt) : new Date(now.getTime() - durationMins * 60 * 1000);
      
      const sellingPrice = p.price || 0;
      const estimatedProfit = Math.round((sellingPrice * 0.35 + Math.random() * 50) * 100) / 100;

      // 1. Add offer data entry to MongoDB productperformances collection
      try {
        await ProductPerformance.create({
          productId: p.productId || p._id.toString(),
          productName: p.name,
          category: p.category,
          soldDate: now,
          sellingTimePeriod: Math.round((durationMins / 60) * 10) / 10,
          profit: estimatedProfit,
          offersApplied: offerName,
          date: now.toISOString().split("T")[0],
          data: {
            offerAppliedAt: appliedAt,
            offerExpiredAt: now,
            offerDurationMinutes: durationMins,
            offerPercentage: p.offerPercentage || p.discountPercent,
            activeOfferDetails: p.activeOfferDetails,
            automaticallyRemoved: true
          }
        });
        console.log(`[Offer Cleanup] Added offer data to ProductPerformance collection for product ${p.productId} (${p.name}): ${offerName}`);
      } catch (dbErr: any) {
        console.error(`Error saving to ProductPerformance collection for ${p.productId}:`, dbErr.message);
      }

      // 2. Also append offer record to productperformance.json fallback file
      try {
        const jsonPath = path.resolve(process.cwd(), "src", "data", "productperformance.json");
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, "utf-8");
          const list = JSON.parse(raw);
          list.push({
            ProductId: p.productId || p._id.toString(),
            ProductName: p.name,
            Category: p.category,
            SellingTimePeriod: Math.round((durationMins / 60) * 10) / 10,
            Profit: estimatedProfit,
            OffersApplied: offerName,
            Date: now.toISOString().split("T")[0]
          });
          fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), "utf-8");
        }
      } catch (jsonErr: any) {
        console.warn(`Could not update productperformance.json fallback:`, jsonErr.message);
      }

      // 3. Remove/Clear the offer from the product automatically
      await Product.findByIdAndUpdate(p._id, {
        $set: { discountPercent: 0 },
        $unset: {
          offerPercentage: 1,
          offerAppliedAt: 1,
          offerDurationMinutes: 1,
          offerExpiresAt: 1,
          activeOfferDetails: 1
        }
      });
      console.log(`[Offer Cleanup] Automatically removed expired offer from product ${p.productId} (${p.name}).`);
    }
  } catch (error: any) {
    console.error("Error in checkAndCleanExpiredProductOffers:", error.message);
  }
}
