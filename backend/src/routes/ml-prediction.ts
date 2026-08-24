import { Router } from "express";
import Employee from "../models/employee.model";
import Performance from "../models/performance.model";
import { z } from "zod";

const router = Router();

// We are calling the external Flask service (assumed to be running on localhost:5000)
const FLASK_ML_SERVICE_URL = process.env.FLASK_ML_SERVICE_URL || "http://127.0.0.1:5000";

router.post("/ml/predict-performance/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get historical performance to calculate average efficiency and tasks completed
    const performances = await Performance.find({ employeeId: id });
    let totalEfficiency = 0;
    let totalTasksCompleted = 0;

    if (performances.length > 0) {
      performances.forEach((p) => {
        totalEfficiency += p.efficiency;
        totalTasksCompleted += p.tasksCompleted;
      });
      totalEfficiency = totalEfficiency / performances.length;
    } else {
      // Default baseline if no performance data exists
      totalEfficiency = 50; 
      totalTasksCompleted = 0;
    }

    // Instead of calling the external Flask service (which might not be running),
    // we use the exact same calculation logic from app.py natively in Node.js.
    const efficiency = totalEfficiency;
    const tasksCompleted = totalTasksCompleted;
    
    // Simulate login hour (e.g., 8 AM to 10.5 AM) if not provided
    const loginHour = req.body.loginHour ? Number(req.body.loginHour) : 8.0 + Math.random() * 2.5;

    // Weight efficiency heavily, add a bit for tasks, penalize late login slightly
    const baseScore = efficiency * 0.7 + (Math.min(tasksCompleted, 10) * 3);
    const timePenalty = Math.max(0, loginHour - 9) * 2;
    const currentPerf = Math.max(0, Math.min(100, baseScore - timePenalty));

    // Determine classification based on calculated percentage
    let classification = "High";
    if (currentPerf <= 30) {
      classification = "Low";
    } else if (currentPerf <= 70) {
      classification = "Medium";
    }

    res.json({
      employeeId: employee._id,
      name: employee.name,
      currentPerformancePercentage: Number(currentPerf.toFixed(1)),
      futurePerformanceClassification: classification,
      simulatedLoginHour: Number(loginHour.toFixed(1))
    });

  } catch (error: any) {
    console.error("Error calling ML service:", error);
    res.status(500).json({ error: "Failed to generate prediction", details: error.message });
  }
});

export default router;
