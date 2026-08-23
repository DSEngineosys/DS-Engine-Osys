import { Router } from "express";
import Admin from "../models/admin.model";
import HR from "../models/hr.model";
import DSEngineer from "../models/ds-engineer.model";
import Setting from "../models/setting.model";
import Notification from "../models/notification.model";
import Employee from "../models/employee.model";
import { sendEmail } from "../lib/email";
import { sendSms } from "../lib/sms";
import { z } from "zod";

const router = Router();

const registerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  isDsEngineer: z.boolean(),
});

const setPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
  role: z.string().optional(),
});

const avatarSchema = z.object({
  avatarUrl: z.string().min(1).max(2_500_000),
});


async function findUserForAuth(input: string, role?: string) {
  let user;
  
  if (!role || role === "employee") {
    user = await Employee.findOne({ $or: [{ email: input.toLowerCase() }, { employeeId: input }] });
    if (user) return { user: user as any, model: Employee, isEmployee: true };
  }
  
  if (!role || role === "ds_engineer") {
    user = await DSEngineer.findOne({ email: input.toLowerCase() });
    if (user) return { user: user as any, model: DSEngineer, isEmployee: false };
  }
  
  if (!role || role === "hr") {
    user = await HR.findOne({ $or: [{ email: input.toLowerCase() }, { hrId: input }] });
    if (user) return { user: user as any, model: HR, isEmployee: false };
  }
  
  if (!role || role === "admin") {
    user = await Admin.findOne({ email: input.toLowerCase() });
    if (user) return { user: user as any, model: Admin, isEmployee: false };
  }
  
  return null;
}

function formatUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: (user as any).role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    hrId: user.hrId,
    monthlySalary: user.monthlySalary,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
  };
}

// DS Engineer registration request — creates a pending user, no password yet.
router.post("/auth/register-request", async (req, res) => {
  const parsed = registerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { name, email, mobile, isDsEngineer } = parsed.data;

  if (!isDsEngineer) {
    res.status(400).json({
      error: "Only DS Engineers can register",
      message: "Please tick the DS Engineer checkbox to request access.",
    });
    return;
  }

  const existing = await DSEngineer.findOne({ email });

  if (existing) {
    const user = existing;
    if (user.status === "denied") {
      res.status(400).json({
        error: "Already denied",
        message: "Your previous request was denied by the Admin.",
      });
      return;
    }
    if (user.status === "pending") {
      res.json({
        message: "Request already pending. Please wait for Admin approval.",
        user: formatUser(user),
      });
      return;
    }
    res.status(400).json({
      error: "Already registered",
      message: "An account with this email already exists. Please sign in.",
    });
    return;
  }

  const user = await DSEngineer.create({
    name,
    email,
    mobile,
    password: "",
    role: "ds_engineer",
    status: "pending",
  });

  // HIGH SECURITY: Send email and notification to admin
  try {
    const { adminEmail, smtpUser } = await import("../lib/email").then(m => m.getSmtpConfig());
    const targetAdminEmail = adminEmail || smtpUser;
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    
    // Create In-App Notification for Admin
    await Notification.create({
      title: "New Registration Request",
      message: `${name} (${email}) has requested access as a DS-Engineer.`,
      type: "registration_request",
      data: { userId: user._id },
      recipientId: null, // Broadcast to admin(s)
    });

    if (targetAdminEmail) {
      const allowUrl = `${baseUrl}/admin/action?id=${user._id}&action=allow`;
      const denyUrl = `${baseUrl}/admin/action?id=${user._id}&action=deny`;

      console.log(`[Registration Request] Sending notification email to Admin (${targetAdminEmail})...`);
      await sendEmail(
        targetAdminEmail,
        "New DS-Engineer Registration Request",
        `A new registration request has been received from ${name} (${email}). Please review it in the Admin Dashboard.`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">New Registration Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            A new DS-Engineer registration request has been received from <strong>${name}</strong> (${email}).
          </p>
          <div style="margin: 32px 0; display: flex; gap: 12px;">
            <a href="${allowUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 8px;">ALLOW ACCESS</a>
            <a href="${denyUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">DENY ACCESS</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            You can also manage this request from the <a href="${baseUrl}/admin/dashboard" style="color: #3b82f6;">Admin Dashboard</a>.
          </p>
        </div>
        `
      );
    }

    // Send acknowledgment email to the registering user
    try {
      await sendEmail(
        email,
        "Registration Request Received",
        `Hello ${name}, your DS Engineer registration request has been submitted to the Admin. You will receive an update once reviewed.`,
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b;">Registration Request Received</h2>
          <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569;">Your request for access to our platform has been sent to the System Administrator for review.</p>
          <p style="color: #475569;">You will receive an email as soon as your access is approved.</p>
        </div>`
      );
    } catch (userEmailErr) {
      console.warn("Could not send acknowledgment email to registrant:", userEmailErr);
    }
  } catch (err) {
    console.error("Non-critical: Failed to notify admin", err);
  }

  res.status(201).json({
    message: "Registration request sent to Admin. Please wait for approval.",
    user: formatUser(user!),
  });
});

// DS Engineer polls this with their email to know whether the admin approved.
router.get("/auth/registration-status", async (req, res) => {
  const email = String(req.query.email ?? "").trim();
  if (!email) {
    res.status(400).json({ error: "Missing email", message: "email query is required" });
    return;
  }
  const user = await DSEngineer.findOne({ email });
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

// After approval the DS Engineer sets their password and is logged in.
router.post("/auth/set-password", async (req, res) => {
  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await DSEngineer.findOne({ email });
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
  const updated = user;

  (req.session as unknown as Record<string, unknown>).userId = updated._id;
  res.json({ user: formatUser(updated), message: "Password set successfully" });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { email, password, role } = parsed.data;
  
  const found = await findUserForAuth(email, role);
  const user = found?.user;
  const isEmployee = found?.isEmployee;

  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (!isEmployee) {
    if (user.status === "pending") {
      res.status(403).json({ error: "Pending", message: "Your account is awaiting Admin approval." });
      return;
    }
    if (user.status === "denied") {
      res.status(403).json({ error: "Denied", message: "Admin has denied your access to the platform." });
      return;
    }
  } else {
    // Check employee account status
    if ((user as any).accountStatus === "Inactive") {
      res.status(403).json({ error: "Inactive", message: "Your account is inactive." });
      return;
    }
  }

  console.log("LOGIN DEBUG - User:", user.email, "Input Pass:", password, "DB Pass:", user.password);
  if (!user.password || user.password !== password) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const session = req.session as unknown as Record<string, unknown>;
  session.userId = user._id;
  session.role = isEmployee ? "employee" : (user as any).role;

  res.json({ 
    user: isEmployee ? { 
      id: user._id, name: user.name, role: "employee", email: user.email, employeeId: (user as any).employeeId 
    } : formatUser(user), 
    message: "Login successful" 
  });
});

// Forgot Password - Request OTP (Sends OTP via Email & SMS)
router.post("/auth/forgot-password/request-otp", async (req, res) => {
  const schema = z.object({
    identifier: z.string().min(1),
    role: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: "Email or mobile number is required" });
    return;
  }
  const input = parsed.data.identifier.trim();
  const role = parsed.data.role;
  const found = await findUserForAuth(input, role);
  if (!found) {
    res.status(404).json({
      error: "User not found",
      message: "No registered account found with provided email or ID.",
    });
    return;
  }
  const { user } = found;



  // Generate 6-digit OTP & expiration (60 seconds)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtp = otp;
  user.resetOtpExpires = new Date(Date.now() + 60 * 1000); // 60 seconds
  await user.save();

  const maskedMobile = user.mobile
    ? user.mobile.replace(/(\+\d{1,3}\s?\d{2})\d+(\d{2})/, "$1****$2")
    : "Registered Mobile";

  let smsSuccess = false;
  let emailSuccess = false;

  // Send OTP SMS to mobile
  if (user.mobile) {
    try {
      await sendSms(user.mobile, `Your password reset authorization OTP code is: ${otp}`, otp);
      smsSuccess = true;
    } catch (smsErr) {
      console.error("[OTP SMS Error] Failed to dispatch SMS:", smsErr);
    }
  }

  // Send OTP Email
  try {
    await sendEmail(
      user.email,
      "Password Reset Verification Code",
      `Your OTP code for resetting your password is: ${otp}. It will expire in 60 seconds.`,
      `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Password Reset Authorization</h2>
        <p style="color: #475569; font-size: 14px;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; font-size: 14px;">You requested a password reset authorization code for your account.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ec4899;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code is valid for 60 seconds. If you did not request a password reset, please ignore this email.</p>
      </div>
      `
    );
    emailSuccess = true;
  } catch (err) {
    console.error("[OTP Email Error] Failed to send OTP email:", err);
  }

  if (!smsSuccess && !emailSuccess) {
    res.status(500).json({ error: "Delivery Failed", message: "Failed to send OTP to both email and mobile. Please check system configurations." });
    return;
  }

  res.json({
    message: "Verification OTP code sent to your registered email and mobile number.",
    mobile: user.mobile || "N/A",
    maskedMobile,
    email: user.email,
    name: user.name,
  });
});

// Forgot Password - Verify OTP
router.post("/auth/forgot-password/verify-otp", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    otp: z.string().min(4),
    role: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: "Email and OTP are required" });
    return;
  }
  const { email, otp, role } = parsed.data;
  const found = await findUserForAuth(email, role);
  const user = found?.user;

  if (!user || !user.resetOtp || user.resetOtp.trim() !== otp.trim()) {
    res.status(400).json({ error: "Invalid OTP", message: "The OTP entered does not match the verification code sent." });
    return;
  }

  if (user.resetOtpExpires && user.resetOtpExpires < new Date()) {
    res.status(400).json({ error: "Expired OTP", message: "This OTP code has expired. Please request a new one." });
    return;
  }

  res.json({ message: "OTP verified successfully", email: user.email });
});

// Forgot Password - Reset Password
router.post("/auth/forgot-password/reset", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { email, password, role } = parsed.data;
  const found = await findUserForAuth(email, role);
  const user = found?.user;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  user.password = password;
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  res.json({ message: "Password created successfully", email: user.email });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }
  
  if (session.role === "employee") {
    const emp = await Employee.findById(session.userId);
    if (!emp) {
      res.status(401).json({ error: "Unauthorized", message: "Employee not found" });
      return;
    }
    res.json({ id: emp._id, name: emp.name, role: "employee", email: emp.email, employeeId: (emp as any).employeeId });
    return;
  }

  let user = await DSEngineer.findById(session.userId);
  if (!user) user = await HR.findById(session.userId);
  if (!user) user = await Admin.findById(session.userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.post("/auth/avatar", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  let updated = await DSEngineer.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });
  if (!updated) updated = await HR.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });
  if (!updated) updated = await Admin.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });
  res.json({ user: formatUser(updated!), message: "Profile photo updated" });
});

router.put("/auth/profile", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }
  const schema = z.object({
    name: z.string().min(1),
    mobile: z.string().min(6).nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  let updated = await DSEngineer.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });
  if (!updated) updated = await HR.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });
  if (!updated) updated = await Admin.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });
  res.json({ user: formatUser(updated!), message: "Profile updated successfully" });
});

// Legacy register endpoint kept for backward compatibility — now treated as a request.
router.post("/auth/register", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    role: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  res.status(410).json({
    error: "Use /auth/register-request",
    message: "Registration now requires Admin approval. Please use the new flow.",
  });
});

export default router;
