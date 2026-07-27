import { Router } from "express";
import User from "../models/user.model";
import Setting from "../models/setting.model";
import Notification from "../models/notification.model";
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
  email: z.string().email(),
  password: z.string(),
});

const avatarSchema = z.object({
  avatarUrl: z.string().min(1).max(2_500_000),
});

function formatUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
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

  const existing = await User.findOne({ email });

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

  const user = await User.create({
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
        "Registration Request Received - DS Engineosys",
        `Hello ${name}, your DS Engineer registration request has been submitted to the Admin. You will receive an update once reviewed.`,
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b;">Registration Request Received</h2>
          <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569;">Your request for access to the DS Engineosys platform has been sent to the System Administrator for review.</p>
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
  const user = await User.findOne({ email });
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
  const user = await User.findOne({ email });
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
  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user || !user.password || user.password !== password) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }
  if (user.status === "pending") {
    res.status(403).json({
      error: "Pending",
      message: "Your account is awaiting Admin approval.",
    });
    return;
  }
  if (user.status === "denied") {
    res.status(403).json({
      error: "Denied",
      message: "Admin has denied your access to the platform.",
    });
    return;
  }
  (req.session as unknown as Record<string, unknown>).userId = user._id;
  res.json({ user: formatUser(user), message: "Login successful" });
});

// Forgot Password - Request OTP (Sends OTP via Email & SMS)
router.post("/auth/forgot-password/request-otp", async (req, res) => {
  const schema = z.object({
    identifier: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: "Email or mobile number is required" });
    return;
  }
  const input = parsed.data.identifier.trim();
  const user = await User.findOne({
    $or: [{ email: input.toLowerCase() }, { mobile: input }, { mobile: { $regex: input } }],
  });

  if (!user) {
    res.status(404).json({
      error: "User not found",
      message: "No registered DS Engineer found with provided email or mobile number.",
    });
    return;
  }

  // Generate 6-digit OTP & expiration (15 mins)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOtp = otp;
  user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const maskedMobile = user.mobile
    ? user.mobile.replace(/(\+\d{1,3}\s?\d{2})\d+(\d{2})/, "$1****$2")
    : "Registered Mobile";

  // Send OTP SMS to mobile
  if (user.mobile) {
    try {
      await sendSms(user.mobile, `[DS Engineosys] Your password reset authorization OTP code is: ${otp}`, otp);
    } catch (smsErr) {
      console.error("[OTP SMS Error] Failed to dispatch SMS:", smsErr);
    }
  }

  // Send OTP Email
  try {
    await sendEmail(
      user.email,
      "Password Reset Verification Code - DS Engineosys",
      `Your OTP code for resetting your password is: ${otp}. It will expire in 15 minutes.`,
      `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Password Reset Authorization</h2>
        <p style="color: #475569; font-size: 14px;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; font-size: 14px;">You requested a password reset authorization code for your DS Engineosys account.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ec4899;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
      `
    );
  } catch (err) {
    console.error("[OTP Email Error] Failed to send OTP email:", err);
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
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: "Email and OTP are required" });
    return;
  }
  const { email, otp } = parsed.data;
  const user = await User.findOne({ email });

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
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });

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
  const user = await User.findById(session.userId);
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
  const updated = await User.findByIdAndUpdate(
    session.userId,
    { avatarUrl: parsed.data.avatarUrl },
    { new: true }
  );
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
  const updated = await User.findByIdAndUpdate(
    session.userId,
    { name: parsed.data.name, mobile: parsed.data.mobile },
    { new: true }
  );
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
