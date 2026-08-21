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

    // Call the external Flask ML service
    const mlResponse = await fetch(`${FLASK_ML_SERVICE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        efficiency: totalEfficiency,
        tasksCompleted: totalTasksCompleted,
        // Optional: Send loginHour if the client provides it, otherwise Flask simulates it
        ...(req.body.loginHour ? { loginHour: req.body.loginHour } : {})
      }),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service Error: ${mlResponse.statusText}`);
    }

    const predictionData = (await mlResponse.json()) as Record<string, any>;

    res.json({
      employeeId: employee._id,
      name: employee.name,
      ...predictionData
    });

  } catch (error: any) {
    console.error("Error calling ML service:", error);
    res.status(500).json({ error: "Failed to generate prediction", details: error.message });
  }
});

export default router;
