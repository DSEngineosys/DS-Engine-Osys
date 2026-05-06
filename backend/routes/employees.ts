import { Router } from "express";
import Employee from "../models/employee.model";
import Department from "../models/department.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

const createEmpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  employeeId: z.string().min(1),
  departmentId: z.string(),
  designation: z.string().min(1),
  joiningDate: z.string(),
  status: z.enum(["active", "inactive", "on_leave"]),
});

const updateEmpSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
});

async function enrichEmployee(emp: any) {
  const dept = await Department.findById(emp.departmentId);
  return {
    id: emp._id,
    name: emp.name,
    email: emp.email,
    employeeId: emp.employeeId,
    departmentId: emp.departmentId,
    departmentName: dept?.name ?? "Unknown",
    designation: emp.designation,
    joiningDate: emp.joiningDate,
    status: emp.status,
    performanceScore: emp.performanceScore ? Number(emp.performanceScore) : null,
    avatarUrl: emp.avatarUrl,
  };
}

router.get("/employees", async (req, res) => {
  const departmentId = req.query.departmentId as string | undefined;
  const search = req.query.search as string | undefined;

  let query: any = {};
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    query.departmentId = new mongoose.Types.ObjectId(departmentId);
  }
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const employees = await Employee.find(query);
  const result = await Promise.all(employees.map(enrichEmployee));
  res.json(result);
});

router.post("/employees", async (req, res) => {
  const parsed = createEmpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const empData = {
    ...parsed.data,
    departmentId: new mongoose.Types.ObjectId(parsed.data.departmentId),
    joiningDate: new Date(parsed.data.joiningDate),
  };

  const emp = await Employee.create(empData);
  res.status(201).json(await enrichEmployee(emp));
});

router.get("/employees/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const emp = await Employee.findById(id);
  if (!emp) { res.status(404).json({ error: "Not found", message: "Employee not found" }); return; }
  res.json(await enrichEmployee(emp));
});

router.put("/employees/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const parsed = updateEmpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.departmentId) {
    updateData.departmentId = new mongoose.Types.ObjectId(parsed.data.departmentId);
  }

  const emp = await Employee.findByIdAndUpdate(id, updateData, { new: true });
  if (!emp) { res.status(404).json({ error: "Not found", message: "Employee not found" }); return; }
  res.json(await enrichEmployee(emp));
});

router.delete("/employees/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  await Employee.findByIdAndDelete(id);
  res.json({ message: "Employee deleted" });
});

export default router;
