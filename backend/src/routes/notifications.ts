import { Router } from "express";
import Notification from "../models/notification.model";
import { z } from "zod";

const router = Router();

// Admin: Send broadcast notification
router.post("/admin/notifications", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Admin only" });
    return;
  }

  const schema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const notification = await Notification.create({
    title: parsed.data.title,
    message: parsed.data.message,
    recipientId: null, // Broadcast
  });

  res.status(201).json(notification);
});

// User: Get notifications
router.get("/notifications", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }

  const notifications = await Notification.find({
    $or: [{ recipientId: session.userId }, { recipientId: null }],
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// User: Mark as read
router.post("/notifications/:id/read", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }

  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

export default router;
