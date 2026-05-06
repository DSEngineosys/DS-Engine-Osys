import { Router } from "express";
import Setting from "../models/setting.model";
import { z } from "zod";

const router = Router();

const updateSettingSchema = z.object({
  value: z.string().min(1),
});

router.get("/settings", async (req, res) => {
  const settings = await Setting.find();
  const result = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(result);
});

router.put("/settings/:key", async (req, res) => {
  const { key } = req.params;
  const parsed = updateSettingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value: parsed.data.value },
    { new: true, upsert: true }
  );
  
  res.json(setting);
});

export default router;
