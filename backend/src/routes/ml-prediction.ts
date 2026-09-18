import { Router } from "express";
import Employee from "../models/employee.model";
import Performance from "../models/performance.model";
import EmployeeDailyPerformance from "../models/employee-daily-performance.model";

const router = Router();

// --- Simple Gaussian Naive Bayes Implementation ---
class GaussianNaiveBayes {
  private classSummaries: Record<string, { mean: number[]; var: number[]; count: number }> = {};
  private classPriors: Record<string, number> = {};
  private totalSamples = 0;

  train(X: number[][], y: string[]) {
    this.totalSamples = X.length;
    const classData: Record<string, number[][]> = {};

    for (let i = 0; i < X.length; i++) {
      const label = y[i];
      if (!classData[label]) classData[label] = [];
      classData[label].push(X[i]);
    }

    for (const label in classData) {
      const data = classData[label];
      const count = data.length;
      this.classPriors[label] = count / this.totalSamples;

      const numFeatures = X[0].length;
      const means = new Array(numFeatures).fill(0);
      const variances = new Array(numFeatures).fill(0);

      // Calculate Means
      for (const row of data) {
        for (let j = 0; j < numFeatures; j++) {
          means[j] += row[j];
        }
      }
      for (let j = 0; j < numFeatures; j++) {
        means[j] /= count;
      }

      // Calculate Variances (with smoothing to prevent div-by-zero)
      const smoothing = 1e-9;
      for (const row of data) {
        for (let j = 0; j < numFeatures; j++) {
          variances[j] += Math.pow(row[j] - means[j], 2);
        }
      }
      for (let j = 0; j < numFeatures; j++) {
        variances[j] = variances[j] / count + smoothing;
      }

      this.classSummaries[label] = { mean: means, var: variances, count };
    }
  }

  private calculateProbability(x: number, mean: number, variance: number): number {
    const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    return (1 / Math.sqrt(2 * Math.PI * variance)) * exponent;
  }

  predict(x: number[]): { predictedClass: string; probabilities: Record<string, number> } {
    const probabilities: Record<string, number> = {};
    let totalProb = 0;

    for (const label in this.classSummaries) {
      const summary = this.classSummaries[label];
      // Log probabilities to avoid underflow
      let logProb = Math.log(this.classPriors[label]);
      
      for (let j = 0; j < x.length; j++) {
        const prob = this.calculateProbability(x[j], summary.mean[j], summary.var[j]);
        logProb += Math.log(prob || 1e-9);
      }
      
      const prob = Math.exp(logProb);
      probabilities[label] = prob;
      totalProb += prob;
    }

    // Normalize
    let bestClass = "";
    let maxProb = -1;
    for (const label in probabilities) {
      probabilities[label] /= (totalProb || 1); // fallback if totalProb is 0
      if (probabilities[label] > maxProb) {
        maxProb = probabilities[label];
        bestClass = label;
      }
    }

    return { predictedClass: bestClass, probabilities };
  }
}


router.post("/ml/predict-performance/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // ─── Fetch All Daily Performance Records for Training ───
    const allDailyRecords = await EmployeeDailyPerformance.find().sort({ date: 1 });
    
    // Extract features for Training: [PerformanceScore] (We could add tasksCompleted, loginHour later)
    const X_train: number[][] = [];
    const y_train: string[] = [];
    const employeeSnapshots: any[] = []; // specifically for THIS employee

    for (const record of allDailyRecords) {
      if (Array.isArray(record.data)) {
        for (const d of record.data) {
          // Identify if this is the target employee's snapshot
          if (d.employeeId === employee.employeeId || String(d._id) === String(employee._id)) {
             employeeSnapshots.push(d);
          }
          
          // Collect training data globally
          const score = typeof d.performanceScore === 'number' ? d.performanceScore : null;
          if (score !== null && !isNaN(score)) {
            // Assign rule-based label for historical training data
            let label = "High";
            if (score <= 30) label = "Low";
            else if (score <= 70) label = "Medium";
            
            X_train.push([score]);
            y_train.push(label);
          }
        }
      }
    }

    // ─── Guard 1: Requires Employee Data ───
    if (employeeSnapshots.length === 0) {
      return res.status(200).json({
        insufficientData: true,
        employeeId: employee._id,
        name: employee.name,
        message: "Not enough data to predict performance. The ML engine requires at least one day of recorded activity in the Daily Performance collection.",
      });
    }

    // ─── Guard 2: Requires Training Data ───
    if (X_train.length < 2) {
       return res.status(200).json({
        insufficientData: true,
        employeeId: employee._id,
        name: employee.name,
        message: "Not enough historical global training data for Naive Bayes model to initialize. Please wait for more daily records across the system.",
      });
    }

    // ─── Train Naive Bayes Model ───
    const nbModel = new GaussianNaiveBayes();
    nbModel.train(X_train, y_train);

    // ─── Predict for Target Employee ───
    // Get average of their historical scores to form their current feature set
    const empScores = employeeSnapshots
      .map(s => s.performanceScore)
      .filter(s => typeof s === 'number' && !isNaN(s));
      
    if (empScores.length === 0) {
        return res.status(200).json({
          insufficientData: true,
          employeeId: employee._id,
          name: employee.name,
          message: "Daily records exist for this employee, but no numeric performance scores are available.",
        });
    }

    const avgScore = empScores.reduce((a, b) => a + b, 0) / empScores.length;
    
    // Predict using NB model
    const prediction = nbModel.predict([avgScore]);
    
    // Construct response
    // For visual representation on frontend, calculate an estimated percentage based on the probabilities
    let currentPerf = avgScore; 
    
    res.json({
      insufficientData: false,
      employeeId: employee._id,
      name: employee.name,
      currentPerformancePercentage: Number(currentPerf.toFixed(1)),
      futurePerformanceClassification: prediction.predictedClass,
      simulatedLoginHour: req.body.loginHour ? Number(req.body.loginHour) : null,
      dataPointsUsed: {
        trainingSetSize: X_train.length,
        employeeSnapshots: employeeSnapshots.length,
      },
      naiveBayesProbabilities: prediction.probabilities
    });

  } catch (error: any) {
    console.error("Error calling ML service:", error);
    res.status(500).json({ error: "Failed to generate prediction", details: error.message });
  }
});

export default router;
