import { Router } from "express";
import User from "../models/user.model";
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
