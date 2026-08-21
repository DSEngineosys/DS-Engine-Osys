from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.naive_bayes import GaussianNB
import random
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Dummy historical data to train the model initially
# Features: [efficiency (0-100), tasks_completed, login_hour (8-18)]
# Classes: 0 (Low), 1 (Medium), 2 (High)
X_train = np.array([
    [20, 1, 9],
    [30, 2, 10],
    [45, 3, 9],
    [60, 4, 8],
    [75, 5, 9],
    [90, 7, 8],
    [10, 0, 11],
    [50, 3, 9],
    [85, 6, 8],
    [95, 8, 9]
])
y_train = np.array([0, 0, 1, 1, 2, 2, 0, 1, 2, 2])

model = GaussianNB()
model.fit(X_train, y_train)

class_map = {0: "Low", 1: "Medium", 2: "High"}

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        efficiency = float(data.get('efficiency', 50))
        tasks_completed = float(data.get('tasksCompleted', 0))
        
        # Simulate login hour (e.g., 8 AM to 10 AM is normal)
        login_hour = float(data.get('loginHour', random.uniform(8.0, 10.5)))
        
        # Prepare feature vector
        features = np.array([[efficiency, tasks_completed, login_hour]])
        
        # Predict class
        prediction = model.predict(features)[0]
        prediction_class = class_map[prediction]
        
        # Calculate current performance % (just a simple heuristic for the demo)
        # Weight efficiency heavily, add a bit for tasks, penalize late login slightly
        base_score = efficiency * 0.7 + (min(tasks_completed, 10) * 3)
        time_penalty = max(0, login_hour - 9) * 2
        current_perf = max(0, min(100, base_score - time_penalty))
        
        # Determine classification strictly based on the calculated percentage 
        # as requested by the user: Low = 0-30%, Medium = 30-70%, High = 70-100%
        if current_perf <= 30:
            classification = "Low"
        elif current_perf <= 70:
            classification = "Medium"
        else:
            classification = "High"

        return jsonify({
            "currentPerformancePercentage": round(current_perf, 1),
            "futurePerformanceClassification": classification,
            "simulatedLoginHour": round(login_hour, 1)
        })

    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
