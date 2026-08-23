import { Router, Request, Response, NextFunction } from "express";
import { sendEmail } from "../lib/email";
import Admin from "../models/admin.model";
import HR from "../models/hr.model";
import DSEngineer from "../models/ds-engineer.model";
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
  const rows = await DSEngineer.find().sort({ createdAt: -1 });
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
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const updated = await DSEngineer.findByIdAndUpdate(id, { status: "approved" }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Notify DS-Engineer via Email
  try {
    await sendEmail(
      updated.email,
      "Registration Approved",
      `Congratulations ${updated.name}! Your registration request has been APPROVED by the Admin. You can now proceed to set your password and access the platform.`
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify DS-Engineer of approval", err);
  }

  res.json({ message: "DS Engineer approved", id: updated._id, status: updated.status });
});

router.post("/admin/registration-requests/:id/deny", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const updated = await DSEngineer.findByIdAndUpdate(id, { status: "denied" }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Notify DS-Engineer via Email
  try {
    await sendEmail(
      updated.email,
      "Registration Denied",
      `Hello ${updated.name}, your registration request has been DENIED by the Admin. Please contact support if you believe this is an error.`
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify DS-Engineer of denial", err);
  }

  res.json({ message: "DS Engineer denied", id: updated._id, status: updated.status });
});

router.delete("/admin/registration-requests/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const deleted = await DSEngineer.findByIdAndDelete(id);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "DS Engineer deleted permanently", id });
});

router.get("/admin/hr-recruitment-requests", requireAdmin, async (_req, res) => {
  const rows = await HR.find().populate("departmentId").populate("subDepartmentId").sort({ createdAt: -1 });
  res.json(rows.map((r: any) => ({
    id: r._id,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    departmentName: r.departmentId?.name || "Unknown",
    subDepartment: r.subDepartmentId?.name || "Unknown",
    status: r.status,
    hrId: r.hrId,
    monthlySalary: r.monthlySalary,
    createdAt: r.createdAt.toISOString()
  })));
});

router.post("/admin/hr-recruitment-requests/:id/allow", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { hrId, monthlySalary } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!hrId || !monthlySalary) { res.status(400).json({ error: "hrId and monthlySalary are required" }); return; }
  
  const updated = await HR.findByIdAndUpdate(id, { status: "approved", hrId, monthlySalary }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    await sendEmail(
      updated.email,
      "HR Registration Approved",
      `Congratulations ${updated.name}! Your HR registration request has been APPROVED. Your HR-ID is ${hrId}. You can now proceed to set your password and access the platform.`
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify HR of approval", err);
  }

  res.json({ message: "HR approved", id: updated._id, status: updated.status });
});

router.post("/admin/hr-recruitment-requests/:id/deny", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const updated = await HR.findByIdAndUpdate(id, { status: "denied" }, { new: true });
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    await sendEmail(
      updated.email,
      "HR Registration Denied",
      `Hello ${updated.name}, your HR registration request has been DENIED by the Admin.`
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify HR of denial", err);
  }

  res.json({ message: "HR denied", id: updated._id, status: updated.status });
});

router.delete("/admin/hr-recruitment-requests/:id", requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const deleted = await HR.findByIdAndDelete(id);
  if (!deleted) {
    res.status(404).json({ error: "HR request not found" });
    return;
  }

  res.json({ message: "HR request deleted successfully", id: deleted._id });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  const totalEngineers = await DSEngineer.countDocuments();
  const approved = await DSEngineer.countDocuments({ status: "approved" });
  const pending = await DSEngineer.countDocuments({ status: "pending" });
  const denied = await DSEngineer.countDocuments({ status: "denied" });

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

router.post("/admin/test-smtp", requireAdmin, async (_req, res) => {
  try {
    const { verifySmtpConnection } = await import("../lib/email");
    await verifySmtpConnection();
    res.json({ message: "SMTP configuration is valid and verified!" });
  } catch (err: any) {
    res.status(400).json({ error: "SMTP Verification Failed", message: err?.message || "Could not connect to SMTP server" });
  }
});

export default router;
