import { Router } from "express";
import Employee from "../models/employee.model";
import Setting from "../models/setting.model";
import Department from "../models/department.model";
import SubDepartment from "../models/sub-department.model";
import Admin from "../models/admin.model";
import HR from "../models/hr.model";
import { sendEmail } from "../lib/email";
import { z } from "zod";
import mongoose from "mongoose";

const router = Router();

const employeeRegisterRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  subDepartmentId: z.string().optional(),
  contactNumber: z.string().min(1),
  gender: z.string().optional(),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
});

router.post("/employee/register-request", async (req, res) => {
  const parsed = employeeRegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const { name, email, department, subDepartmentId: subDepartmentId, contactNumber, gender, location, jobTitle } = parsed.data;

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
  // Find department by ID or by Name
  let deptDoc = null;
  if (mongoose.Types.ObjectId.isValid(department)) {
    deptDoc = await Department.findById(department);
  }
  if (!deptDoc) {
    deptDoc = await Department.findOne({ name: new RegExp(`^${department}$`, "i") });
  }
  if (!deptDoc) {
    res.status(404).json({ error: "Department not found", message: `Department '${department}' not found.` });
    return;
  }

  const deptIdStr = deptDoc._id.toString();
  const deptObjId = new mongoose.Types.ObjectId(deptIdStr);
  const deptQuery = { $in: [deptObjId, deptIdStr, deptDoc.name] };
  const hrStatusQuery = { $in: ["approved", "Approved", "active", "Active"] };

  // Collect all possible sub-department representations (ID, ObjectId, Name)
  const subDeptIds: any[] = [];
  let resolvedSubDeptId: mongoose.Types.ObjectId | undefined = undefined;

  if (subDepartmentId && subDepartmentId !== "none") {
    subDeptIds.push(subDepartmentId);
    if (mongoose.Types.ObjectId.isValid(subDepartmentId)) {
      resolvedSubDeptId = new mongoose.Types.ObjectId(subDepartmentId);
      subDeptIds.push(resolvedSubDeptId);
      try {
        const subDoc = await SubDepartment.findById(subDepartmentId);
        if (subDoc) {
          subDeptIds.push(subDoc.name);
          subDeptIds.push(subDoc.name.toLowerCase());
        }
      } catch (e) {}
    } else {
      try {
        const subDoc = await SubDepartment.findOne({ name: new RegExp(`^${subDepartmentId}$`, "i") });
        if (subDoc) {
          resolvedSubDeptId = subDoc._id as mongoose.Types.ObjectId;
          subDeptIds.push(subDoc._id);
          subDeptIds.push(subDoc._id.toString());
        }
      } catch (e) {}
    }
  }

  // Find HR assigned to this department / sub-department
  let hrUser: any = null;
  if (subDeptIds.length > 0) {
    hrUser = await HR.findOne({
      role: "hr",
      departmentId: deptQuery,
      subDepartmentId: { $in: subDeptIds },
      status: hrStatusQuery,
    } as any);
  }

  if (!hrUser) {
    hrUser = await HR.findOne({
      role: "hr",
      departmentId: deptQuery,
      status: hrStatusQuery,
    } as any);
  }

  if (!hrUser) {
    hrUser = await HR.findOne({
      role: "hr",
      status: hrStatusQuery,
    } as any);
  }

  // Create the Employee record in MongoDB with accountStatus "Pending"
  const emp = await Employee.create({
    name,
    email,
    employeeId: `PENDING-${Date.now()}`, // Temporary ID until HR approves
    departmentId: deptDoc._id,
    subDepartmentId: resolvedSubDeptId,
    designation: "Employee",
    joiningDate: new Date(),
    status: "inactive",
    accountStatus: "Pending",
    contactNumber,
    gender,
    location,
    jobTitle,
    password: "",
  });

  // 1. Notify HR via Email (or fallback to Admin email if HR email not found)
  const { getSmtpConfig } = await import("../lib/email");
  const smtpConfig = await getSmtpConfig();
  const targetHrEmail = hrUser?.email || smtpConfig.adminEmail || smtpConfig.smtpUser;

  if (targetHrEmail) {
    try {
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      await sendEmail(
        targetHrEmail,
        "New Employee Registration Request",
        `A new employee registration request has been received from ${name} (${email}). Please review it in the HR Dashboard.`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">New Registration Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">
            A new Employee registration request has been received from <strong>${name}</strong> (${email}) for Department: <strong>${deptDoc.name}</strong> ${subDepartmentId ? ' / Sub-Department: ' + subDepartmentId : ''}.
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

  // 2. Send acknowledgment email to the registering employee
  if (email) {
    try {
      await sendEmail(
        email,
        "Registration Request Received",
        `Hello ${name}, your employee registration request has been submitted to your Department HR. You will receive an update once reviewed.`,
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b;">Registration Request Received</h2>
          <p style="color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569;">Your request for access as an Employee in <strong>${deptDoc.name}</strong> has been submitted to your Department HR for review.</p>
          <p style="color: #475569;">You will receive an email update as soon as your access is approved.</p>
        </div>`
      );
    } catch (err) {
      console.warn("Could not send acknowledgment email to registrant:", err);
    }
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
