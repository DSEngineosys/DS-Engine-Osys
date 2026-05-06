import { Router } from "express";
import Performance from "../models/performance.model";
import Employee from "../models/employee.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

const createPerfSchema = z.object({
  employeeId: z.string(),
  period: z.string().min(1),
  score: z.number(),
  tasksCompleted: z.number().int(),
  tasksFailed: z.number().int(),
  efficiency: z.number(),
  notes: z.string().nullable().optional(),
});

async function enrichRecord(rec: any) {
  const emp = await Employee.findById(rec.employeeId);
  return {
    id: rec._id,
    employeeId: rec.employeeId,
    employeeName: emp?.name ?? "Unknown",
    period: rec.period,
    score: Number(rec.score),
    tasksCompleted: rec.tasksCompleted,
    tasksFailed: rec.tasksFailed,
    efficiency: Number(rec.efficiency),
    notes: rec.notes,
    createdAt: rec.createdAt.toISOString(),
  };
}

router.get("/performance", async (req, res) => {
  const employeeId = req.query.employeeId as string | undefined;
  const query = (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) 
    ? { employeeId: new mongoose.Types.ObjectId(employeeId) } 
    : {};
  
  const records = await Performance.find(query);
  const result = await Promise.all(records.map(enrichRecord));
  res.json(result);
});

router.post("/performance", async (req, res) => {
  const parsed = createPerfSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const rec = await Performance.create({
    ...parsed.data,
    employeeId: new mongoose.Types.ObjectId(parsed.data.employeeId),
    notes: parsed.data.notes ?? undefined,
  });

  // Update employee performance score
  await Employee.findByIdAndUpdate(parsed.data.employeeId, { 
    performanceScore: parsed.data.score 
  });

  res.status(201).json(await enrichRecord(rec));
});

export default router;
