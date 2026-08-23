import { Router } from "express";
import Employee from "../models/employee.model";
import Setting from "../models/setting.model";
import Department from "../models/department.model";
import User from "../models/user.model";
import { sendEmail } from "../lib/email";
import { z } from "zod";
import mongoose from "mongoose";

const router = Router();

const employeeRegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  subDepartment: z.string().optional(),
  contactNumber: z.string().min(1),
  gender: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
});

router.post("/employee/register-request", async (req, res) => {
  const parsed = employeeRegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { name, email, department, subDepartment, contactNumber, gender, location, employmentType } = parsed.data;

  const existing = await Employee.findOne({ email });

  if (existing) {
    if (existing.accountStatus === "Denied") {
      res.status(400).json({
        error: "Already denied",
        message: "Your previous request was denied by HR.",
      });
      return;
    }
    if (existing.accountStatus === "Pending") {
      res.json({
        message: "Request already pending. Please wait for HR approval.",
        employee: { email: existing.email, name: existing.name },
      });
      return;
    }
    res.status(400).json({
      error: "Already registered",
      message: "An account with this email already exists. Please sign in.",
    });
    return;
  }
  
  const deptDoc = await Department.findById(department);
  if(!deptDoc){
      res.status(404).json({error: "Department not found"});
      return;
  }

  // Find the HR responsible for this specific department + sub-department.
  // First try exact match (department + subDepartment).
  // Fall back to department-only HR if no sub-department-specific HR exists.
  let hrUser = subDepartment
    ? await User.findOne({ role: "hr", departmentId: department, subDepartment, status: "approved" })
    : null;

  if (!hrUser) {
    hrUser = await User.findOne({ role: "hr", departmentId: department, status: "approved" });
  }

  // 🔒 BLOCK: If no HR is appointed for this department/sub-department, registration is not allowed.
  if (!hrUser) {
    const label = subDepartment ? `${deptDoc.name} → ${subDepartment}` : deptDoc.name;
    res.status(422).json({
      error: "No HR appointed",
      message: `No HR representative has been appointed for ${label} yet. Registration is not available until an HR is assigned. Please contact the Administrator.`,
    });
    return;
  }


  const emp = await Employee.create({
    name,
    email,
    employeeId: `PENDING-${Date.now()}`, // Temporary ID until HR approves
    departmentId: new mongoose.Types.ObjectId(department),
    subDepartmentId,
    designation: "Employee",
    joiningDate: new Date(),
    status: "inactive",
    accountStatus: "Pending",
    contactNumber,
    gender,
    location,
    employmentType,
    password: "",
  });

  // Notify HR via Email (if HR exists)
  if (hrUser && hrUser.email) {
    try {
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      await sendEmail(
        hrUser.email,
        "New Employee Registration Request",
        `A new employee registration request has been received from ${name} (${email}). Please review it in the HR Dashboard.`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">New Registration Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            A new Employee registration request has been received from <strong>${name}</strong> (${email}) for ${deptDoc.name} ${subDepartment ? '- ' + subDepartment : ''}.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You can manage this request from the <a href="${baseUrl}/hr/dashboard" style="color: #3b82f6;">HR Dashboard</a> under the Employee Recruitment tab.
          </p>
        </div>
        `
      );
    } catch (err) {
      console.error("Non-critical: Failed to notify HR", err);
    }
  }

  // Send acknowledgment email to the registering employee
  try {
    await sendEmail(
      email,
      "Registration Request Received - DS Engineosys",
      `Hello ${name}, your employee registration request has been submitted to your Department HR. You will receive an update once reviewed.`,
      `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Registration Request Received</h2>
        <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569;">Your request for access as an Employee has been sent to your Department HR for review.</p>
        <p style="color: #475569;">You will receive an email as soon as your access is approved.</p>
      </div>`
    );
  } catch (err) {
    console.warn("Could not send acknowledgment email to registrant:", err);
  }

  res.status(201).json({
    message: "Registration request sent to HR. Please wait for approval.",
    employee: { email: emp.email, name: emp.name },
  });
});

router.get("/employee/registration-status", async (req, res) => {
  const email = String(req.query.email ?? "").trim();
  if (!email) {
    res.status(400).json({ error: "Missing email", message: "email query is required" });
    return;
  }
  const emp = await Employee.findOne({ email });
  if (!emp) {
    res.status(404).json({ error: "Not found", message: "No registration found" });
    return;
  }
  
  let status = "pending";
  if(emp.accountStatus === "Active") status = "approved";
  else if (emp.accountStatus === "Denied") status = "denied";

  res.json({
    email: emp.email,
    name: emp.name,
    status,
    hasPassword: Boolean(emp.password && emp.password.length > 0),
  });
});

const employeeSetPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/employee/set-password", async (req, res) => {
  const parsed = employeeSetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const emp = await Employee.findOne({ email });
  if (!emp) {
    res.status(404).json({ error: "Not found", message: "No registration found" });
    return;
  }
  if (emp.accountStatus !== "Active") {
    res.status(403).json({
      error: "Not approved",
      message: "HR has not approved your access yet.",
    });
    return;
  }
  emp.password = password;
  await emp.save();

  res.json({ message: "Password set successfully" });
});

export default router;
