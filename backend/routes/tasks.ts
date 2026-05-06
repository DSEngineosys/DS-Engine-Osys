import { Router } from "express";
import Task from "../models/task.model";
import Employee from "../models/employee.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  employeeId: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  dueDate: z.string().nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  dueDate: z.string().nullable().optional(),
});

async function enrichTask(task: any) {
  const emp = await Employee.findById(task.employeeId);
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    employeeId: task.employeeId,
    employeeName: emp?.name ?? "Unknown",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}

router.get("/tasks", async (req, res) => {
  const employeeId = req.query.employeeId as string | undefined;
  const status = req.query.status as string | undefined;

  let query: any = {};
  if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
    query.employeeId = new mongoose.Types.ObjectId(employeeId);
  }
  if (status) {
    query.status = status;
  }

  const tasks = await Task.find(query);
  const result = await Promise.all(tasks.map(enrichTask));
  res.json(result);
});

router.post("/tasks", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const taskData = {
    ...parsed.data,
    employeeId: new mongoose.Types.ObjectId(parsed.data.employeeId),
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    description: parsed.data.description ?? undefined,
  };

  const task = await Task.create(taskData);
  res.status(201).json(await enrichTask(task));
});

router.get("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const task = await Task.findById(id);
  if (!task) { res.status(404).json({ error: "Not found", message: "Task not found" }); return; }
  res.json(await enrichTask(task));
});

router.put("/tasks/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
  }
  if (parsed.data.dueDate) {
    updateData.dueDate = new Date(parsed.data.dueDate);
  }

  const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
  if (!task) { res.status(404).json({ error: "Not found", message: "Task not found" }); return; }
  res.json(await enrichTask(task));
});

export default router;
