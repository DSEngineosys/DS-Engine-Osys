import { Router } from "express";
import { db, employeesTable, departmentsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createEmpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  employeeId: z.string().min(1),
  departmentId: z.number().int(),
  designation: z.string().min(1),
  joiningDate: z.string(),
  status: z.enum(["active", "inactive", "on_leave"]),
});

const updateEmpSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  departmentId: z.number().int().optional(),
  designation: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
});

async function enrichEmployee(emp: typeof employeesTable.$inferSelect) {
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, emp.departmentId)).limit(1);
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    employeeId: emp.employeeId,
    departmentId: emp.departmentId,
    departmentName: dept?.name ?? "Unknown",
    designation: emp.designation,
    joiningDate: emp.joiningDate,
    status: emp.status,
    performanceScore: emp.performanceScore ? Number(emp.performanceScore) : null,
    avatarUrl: emp.avatarUrl,
  };
}

router.get("/employees", async (req, res) => {
  const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
  const search = req.query.search as string | undefined;

  let conditions = [];
  if (departmentId) conditions.push(eq(employeesTable.departmentId, departmentId));
  if (search) conditions.push(ilike(employeesTable.name, `%${search}%`));

  const employees = conditions.length > 0
    ? await db.select().from(employeesTable).where(and(...conditions))
    : await db.select().from(employeesTable);

  const result = await Promise.all(employees.map(enrichEmployee));
  res.json(result);
});

router.post("/employees", async (req, res) => {
  const parsed = createEmpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [emp] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json(await enrichEmployee(emp));
});

router.get("/employees/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, id)).limit(1);
  if (!emp) { res.status(404).json({ error: "Not found", message: "Employee not found" }); return; }
  res.json(await enrichEmployee(emp));
});

router.put("/employees/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateEmpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [emp] = await db.update(employeesTable).set(parsed.data).where(eq(employeesTable.id, id)).returning();
  if (!emp) { res.status(404).json({ error: "Not found", message: "Employee not found" }); return; }
  res.json(await enrichEmployee(emp));
});

router.delete("/employees/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.json({ message: "Employee deleted" });
});

export default router;
