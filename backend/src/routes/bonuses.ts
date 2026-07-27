import { Router } from "express";
import Bonus from "../models/bonus.model";
import Department from "../models/department.model";
import Employee from "../models/employee.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

// Get active bonus offers for DS Engineer home page
router.get("/bonuses", async (_req, res) => {
  try {
    const bonuses = await Bonus.find({ status: "active" }).sort({ createdAt: -1 });
    res.json(bonuses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bonuses" });
  }
});

// Admin: Get all bonus offers
router.get("/admin/bonuses", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
    return;
  }
  try {
    const bonuses = await Bonus.find().sort({ createdAt: -1 });
    res.json(bonuses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin bonuses" });
  }
});

// Admin: Create a new bonus offer
router.post("/admin/bonuses", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
    return;
  }

  const schema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    bonusAmount: z.string().min(1),
    departmentId: z.string().optional(),
    subDepartment: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { title, description, bonusAmount, departmentId, subDepartment } = parsed.data;

  let departmentName = "";
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    const dept = await Department.findById(departmentId);
    if (dept) departmentName = dept.name;
  }

  try {
    const bonus = await Bonus.create({
      title,
      description,
      bonusAmount,
      departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : undefined,
      departmentName: departmentName || "All Departments",
      subDepartment: subDepartment || "",
      status: "active",
      assignedEmployees: [],
    });
    res.status(201).json(bonus);
  } catch (err) {
    res.status(500).json({ error: "Failed to create bonus offer" });
  }
});

// Admin: Delete a bonus offer
router.delete("/admin/bonuses/:id", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.isAdmin) {
    res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    await Bonus.findByIdAndDelete(id);
    res.json({ message: "Bonus offer deleted successfully", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bonus offer" });
  }
});

// DS Engineer: Assign bonus offer to an employee
router.post("/bonuses/:id/assign", async (req, res) => {
  const session = req.session as unknown as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Not logged in" });
    return;
  }

  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid bonus ID" });
    return;
  }

  const schema = z.object({
    employeeId: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { employeeId } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    res.status(400).json({ error: "Invalid employee ID" });
    return;
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  const bonus = await Bonus.findById(id);
  if (!bonus) {
    res.status(404).json({ error: "Bonus offer not found" });
    return;
  }

  // Check if already assigned
  const alreadyAssigned = bonus.assignedEmployees.some(
    (a) => a.employeeId.toString() === employeeId
  );

  if (alreadyAssigned) {
    res.status(400).json({ error: "Bonus already assigned to this employee" });
    return;
  }

  bonus.assignedEmployees.push({
    employeeId: employee._id as any,
    employeeName: employee.name,
    assignedAt: new Date(),
    status: "assigned",
  });

  await bonus.save();
  res.json({ message: `Bonus assigned to ${employee.name} successfully`, bonus });
});

export default router;
