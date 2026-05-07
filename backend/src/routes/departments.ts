import { Router } from "express";
import Department from "../models/department.model";
import Employee from "../models/employee.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

const createDeptSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

async function getDepartmentWithCount(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  
  const dept = await Department.findById(id);
  if (!dept) return null;
  
  const empCount = await Employee.countDocuments({ departmentId: id });
  return { 
    id: dept._id,
    name: dept.name,
    parentId: dept.parentId,
    description: dept.description,
    employeeCount: empCount 
  };
}

router.get("/departments", async (req, res) => {
  const depts = await Department.find();
  const result = await Promise.all(depts.map(async (d) => {
    const empCount = await Employee.countDocuments({ departmentId: d._id });
    return { 
      id: d._id,
      name: d.name,
      parentId: d.parentId,
      description: d.description,
      employeeCount: empCount 
    };
  }));
  res.json(result);
});

router.post("/departments", async (req, res) => {
  const parsed = createDeptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const deptData: any = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  };
  
  if (parsed.data.parentId) {
    deptData.parentId = new mongoose.Types.ObjectId(parsed.data.parentId);
  }

  const dept = await Department.create(deptData);
  res.status(201).json({ 
    id: dept._id,
    name: dept.name,
    parentId: dept.parentId,
    description: dept.description,
    employeeCount: 0 
  });
});

router.get("/departments/:id", async (req, res) => {
  const id = req.params.id;
  const dept = await getDepartmentWithCount(id);
  if (!dept) { res.status(404).json({ error: "Not found", message: "Department not found" }); return; }
  res.json(dept);
});

export default router;
