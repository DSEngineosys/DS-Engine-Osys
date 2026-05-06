import { Router } from "express";
import { db, tasksTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  employeeId: z.number().int(),
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

async function enrichTask(task: typeof tasksTable.$inferSelect) {
  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, task.employeeId)).limit(1);
  return {
    id: task.id,
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
  const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
  const status = req.query.status as string | undefined;

  let conditions = [];
  if (employeeId) conditions.push(eq(tasksTable.employeeId, employeeId));
  if (status) conditions.push(eq(tasksTable.status, status));

  const tasks = conditions.length > 0
    ? await db.select().from(tasksTable).where(and(...conditions))
    : await db.select().from(tasksTable);

  const result = await Promise.all(tasks.map(enrichTask));
  res.json(result);
});

router.post("/tasks", async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    employeeId: parsed.data.employeeId,
    status: parsed.data.status,
    priority: parsed.data.priority,
    dueDate: parsed.data.dueDate ?? null,
  }).returning();
  res.status(201).json(await enrichTask(task));
});

router.get("/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!task) { res.status(404).json({ error: "Not found", message: "Task not found" }); return; }
  res.json(await enrichTask(task));
});

router.put("/tasks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
  }
  const [task] = await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, id)).returning();
  if (!task) { res.status(404).json({ error: "Not found", message: "Task not found" }); return; }
  res.json(await enrichTask(task));
});

export default router;
