import { Router } from "express";
import { db, performanceTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createPerfSchema = z.object({
  employeeId: z.number().int(),
  period: z.string().min(1),
  score: z.number(),
  tasksCompleted: z.number().int(),
  tasksFailed: z.number().int(),
  efficiency: z.number(),
  notes: z.string().nullable().optional(),
});

async function enrichRecord(rec: typeof performanceTable.$inferSelect) {
  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, rec.employeeId)).limit(1);
  return {
    id: rec.id,
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
  const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
  const records = employeeId
    ? await db.select().from(performanceTable).where(eq(performanceTable.employeeId, employeeId))
    : await db.select().from(performanceTable);
  const result = await Promise.all(records.map(enrichRecord));
  res.json(result);
});

router.post("/performance", async (req, res) => {
  const parsed = createPerfSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [rec] = await db.insert(performanceTable).values({
    employeeId: parsed.data.employeeId,
    period: parsed.data.period,
    score: String(parsed.data.score),
    tasksCompleted: parsed.data.tasksCompleted,
    tasksFailed: parsed.data.tasksFailed,
    efficiency: String(parsed.data.efficiency),
    notes: parsed.data.notes ?? null,
  }).returning();

  // Update employee performance score
  await db.update(employeesTable)
    .set({ performanceScore: String(parsed.data.score) })
    .where(eq(employeesTable.id, parsed.data.employeeId));

  res.status(201).json(await enrichRecord(rec));
});

export default router;
