import { Router } from "express";
import Admin from "../models/admin.model";
import HR from "../models/hr.model";
import Department from "../models/department.model";
import Notification from "../models/notification.model";
import { sendEmail } from "../lib/email";
import { z } from "zod";
import mongoose from "mongoose";

const router = Router();

const hrRegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  departmentId: z.string().min(1),
  subDepartmentId: z.string().min(1),
});

router.post("/hr/register-request", async (req, res) => {
  const parsed = hrRegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { name, email, mobile, departmentId, subDepartmentId } = parsed.data;

  // Check if department exists
  const dept = await Department.findById(departmentId);
  if (!dept) {
    res.status(404).json({ error: "Not found", message: "Department not found" });
    return;
  }

  // Enforce one HR per department
  const existingHR = await HR.findOne({ role: "hr", departmentId, status: { $in: ["approved", "pending"] } });
  if (existingHR) {
    res.status(400).json({
      error: "Department already has HR",
      message: "This department already has a registered or pending HR representative.",
    });
    return;
  }

  const existing = await HR.findOne({ email });

  if (existing) {
    if (existing.status === "denied") {
      res.status(400).json({
        error: "Already denied",
        message: "Your previous request was denied by the Admin.",
      });
      return;
    }
    if (existing.status === "pending") {
      res.json({
        message: "Request already pending. Please wait for Admin approval.",
        user: { email: existing.email, name: existing.name },
      });
      return;
    }
    res.status(400).json({
      error: "Already registered",
      message: "An account with this email already exists. Please sign in.",
    });
    return;
  }

  const user = await (HR as any).create({
    name,
    email,
    mobile,
    departmentId: new mongoose.Types.ObjectId(departmentId),
    subDepartmentId,
    password: "",
    role: "hr",
    status: "pending",
  });

  // Notify admin
  try {
    const { adminEmail, smtpUser } = await import("../lib/email").then(m => m.getSmtpConfig());
    const targetAdminEmail = adminEmail || smtpUser;
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    
    await Notification.create({
      title: "New HR Registration Request",
      message: `${name} (${email}) has requested access as HR for ${dept.name}.`,
      type: "registration_request",
      data: { userId: user._id },
      recipientId: null, // Broadcast to admin(s)
    });

    if (targetAdminEmail) {
      await sendEmail(
        targetAdminEmail,
        "New HR Registration Request",
        `A new HR registration request has been received from ${name} (${email}) for Department: ${dept.name}. Please review it in the Admin Dashboard.`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">New HR Registration Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            A new HR registration request has been received from <strong>${name}</strong> (${email}) for <strong>${dept.name}</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You can manage this request from the <a href="${baseUrl}/admin/dashboard" style="color: #3b82f6;">Admin Dashboard</a>.
          </p>
        </div>
        `
      );
    }

    // Send acknowledgment email
    await sendEmail(
      email,
      "Registration Request Received",
      `Hello ${name}, your HR registration request has been submitted to the Admin. You will receive an update once reviewed.`,
      `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Registration Request Received</h2>
        <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569;">Your request for access to the HR portal has been sent to the System Administrator for review.</p>
        <p style="color: #475569;">You will receive an email as soon as your access is approved.</p>
      </div>`
    );
  } catch (err) {
    console.error("Failed to notify about HR registration", err);
  }

  res.status(201).json({
    message: "Registration request sent to Admin. Please wait for approval.",
    user: { email: user.email, name: user.name },
  });
});

router.get("/hr/registration-status", async (req, res) => {
  const email = String(req.query.email ?? "").trim();
  if (!email) {
    res.status(400).json({ error: "Missing email", message: "email query is required" });
    return;
  }
  const user = await HR.findOne({ email, role: "hr" });
  if (!user) {
    res.status(404).json({ error: "Not found", message: "No registration found" });
    return;
  }
  res.json({
    email: user.email,
    name: user.name,
    status: user.status,
    hasPassword: Boolean(user.password && user.password.length > 0),
  });
});

const setPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/hr/set-password", async (req, res) => {
  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await HR.findOne({ email, role: "hr" });
  if (!user) {
    res.status(404).json({ error: "Not found", message: "No registration found" });
    return;
  }
  if (user.status !== "approved") {
    res.status(403).json({
      error: "Not approved",
      message: "Admin has not approved your access yet.",
    });
    return;
  }
  user.password = password;
  await user.save();

  res.json({ message: "Password set successfully" });
});

// Forgot Password flows for HR are identical to DS Engineer but query role: "hr"
// Because login can be done by email or hrId, the identifier could be either.
// They share the same user model, so we can reuse the existing endpoints in auth.ts
// But to be explicit, we'll add them here if requested. Actually, auth.ts endpoints
// already search by email/mobile and update `User`. So HR forgot password works out of the box
// by calling `/api/auth/forgot-password/request-otp` etc.

export default router;
