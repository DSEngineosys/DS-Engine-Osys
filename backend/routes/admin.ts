import { Router, Request, Response, NextFunction } from "express";
import { db, usersTable, employeesTable, productsTable, tasksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin@123";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
    return;
  }
  next();
}

router.post("/admin/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid admin credentials" });
    return;
  }
  (req.session as unknown as Record<string, unknown>).isAdmin = true;
  (req.session as unknown as Record<string, unknown>).adminUsername = ADMIN_USERNAME;
  res.json({
    admin: {
      username: ADMIN_USERNAME,
      name: "System Administrator",
      role: "admin",
    },
    message: "Admin login successful",
  });
});

router.post("/admin/logout", (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  delete session.isAdmin;
  delete session.adminUsername;
  res.json({ message: "Admin logged out" });
});

router.get("/admin/me", (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in as admin" });
    return;
  }
  res.json({
    username: session.adminUsername ?? ADMIN_USERNAME,
    name: "System Administrator",
    role: "admin",
  });
});

router.get("/admin/registration-requests", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      mobile: usersTable.mobile,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "ds_engineer"))
    .orderBy(sql`${usersTable.createdAt} DESC`);
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/admin/registration-requests/:id/allow", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ status: "approved" })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "DS Engineer approved", id: updated.id, status: updated.status });
});

router.post("/admin/registration-requests/:id/deny", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ status: "denied" })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "DS Engineer denied", id: updated.id, status: updated.status });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  const [{ totalEngineers, approved, pending, denied }] = await db
    .select({
      totalEngineers: sql<number>`count(*)::int`,
      approved: sql<number>`count(*) filter (where status='approved')::int`,
      pending: sql<number>`count(*) filter (where status='pending')::int`,
      denied: sql<number>`count(*) filter (where status='denied')::int`,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "ds_engineer"));

  const [{ employeeCount }] = await db
    .select({ employeeCount: sql<number>`count(*)::int` })
    .from(employeesTable);
  const [{ productCount }] = await db
    .select({ productCount: sql<number>`count(*)::int` })
    .from(productsTable);
  const [{ taskCount, taskDone }] = await db
    .select({
      taskCount: sql<number>`count(*)::int`,
      taskDone: sql<number>`count(*) filter (where status='completed')::int`,
    })
    .from(tasksTable);

  res.json({
    engineers: { total: totalEngineers, approved, pending, denied },
    company: {
      employees: employeeCount,
      products: productCount,
      tasksTotal: taskCount,
      tasksCompleted: taskDone,
      progressPercent:
        taskCount > 0 ? Math.round((Number(taskDone) / Number(taskCount)) * 100) : 0,
    },
  });
});

export default router;
