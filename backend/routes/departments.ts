import { Router } from "express";
import { db, departmentsTable, employeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createDeptSchema = z.object({
  name: z.string().min(1),
  parentId: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
});

async function getDepartmentWithCount(id: number) {
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id)).limit(1);
  if (!dept) return null;
  const [{ empCount }] = await db.select({ empCount: count() }).from(employeesTable).where(eq(employeesTable.departmentId, id));
  return { ...dept, employeeCount: Number(empCount) };
}

router.get("/departments", async (req, res) => {
  const depts = await db.select().from(departmentsTable);
  const result = await Promise.all(depts.map(async (d) => {
    const [{ empCount }] = await db.select({ empCount: count() }).from(employeesTable).where(eq(employeesTable.departmentId, d.id));
    return { ...d, employeeCount: Number(empCount) };
  }));
  res.json(result);
});

router.post("/departments", async (req, res) => {
  const parsed = createDeptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values({
    name: parsed.data.name,
    parentId: parsed.data.parentId ?? null,
    description: parsed.data.description ?? null,
  }).returning();
  res.status(201).json({ ...dept, employeeCount: 0 });
});

router.get("/departments/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const dept = await getDepartmentWithCount(id);
  if (!dept) { res.status(404).json({ error: "Not found", message: "Department not found" }); return; }
  res.json(dept);
});

export default router;
