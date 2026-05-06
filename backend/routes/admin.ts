import { Router, Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import Employee from "../models/employee.model";
import Product from "../models/product.model";
import Task from "../models/task.model";
import mongoose from "mongoose";
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
  const rows = await User.find({ role: "ds_engineer" }).sort({ createdAt: -1 });
  res.json(rows.map((r: any) => ({
    id: r._id,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    status: r.status,
    createdAt: r.createdAt.toISOString()
  })));
});

router.post("/admin/registration-requests/:id/allow", requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const updated = await User.findByIdAndUpdate(id, { status: "approved" }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "DS Engineer approved", id: updated._id, status: updated.status });
});

router.post("/admin/registration-requests/:id/deny", requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const updated = await User.findByIdAndUpdate(id, { status: "denied" }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "DS Engineer denied", id: updated._id, status: updated.status });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  const totalEngineers = await User.countDocuments({ role: "ds_engineer" });
  const approved = await User.countDocuments({ role: "ds_engineer", status: "approved" });
  const pending = await User.countDocuments({ role: "ds_engineer", status: "pending" });
  const denied = await User.countDocuments({ role: "ds_engineer", status: "denied" });

  const employeeCount = await Employee.countDocuments();
  const productCount = await Product.countDocuments();
  const taskCount = await Task.countDocuments();
  const taskDone = await Task.countDocuments({ status: "completed" });

  res.json({
    engineers: { total: totalEngineers, approved, pending, denied },
    company: {
      employees: employeeCount,
      products: productCount,
      tasksTotal: taskCount,
      tasksCompleted: taskDone,
      progressPercent: taskCount > 0 ? Math.round((taskDone / taskCount) * 100) : 0,
    },
  });
});

export default router;
