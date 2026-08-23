import { Router } from "express";
import Employee from "../models/employee.model";
import Product from "../models/product.model";
import HelpRequest from "../models/help-request.model";
import CustomerFeedback from "../models/customer-feedback.model";
import Setting from "../models/setting.model";
import Department from "../models/department.model";
import { sendEmail } from "../lib/email";
import { z } from "zod";
import mongoose from "mongoose";
import User from "../models/user.model";
import nodemailer from "nodemailer";

const router = Router();

function requireHR(req: any, res: any, next: any) {
  const session = req.session as any;
  if (!session.userId || session.role !== "hr") {
    return res.status(401).json({ error: "Unauthorized", message: "HR login required" });
  }
  next();
}

// ─────────────────────────────────────────────
// HELP REQUESTS (from public help page)
// ─────────────────────────────────────────────
const helpRequestSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  department: z.string().min(1),
  subDepartment: z.string().optional(),
  phoneNumber: z.string().min(1),
  email: z.string().optional(),
  issueType: z.string().min(1),
  description: z.string().min(1),
});

router.post("/help-requests", async (req: any, res: any) => {
  const parsed = helpRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", message: parsed.error.message });
  }

  const helpReq = await HelpRequest.create(parsed.data);

  // Send Email to HR if configured
  try {
    const hrEmailSetting = await Setting.findOne({ key: "hrEmail" });
    const hrEmail = hrEmailSetting?.value;
    
    const hrAppPasswordSetting = await Setting.findOne({ key: "hrAppPassword" });
    const hrAppPassword = hrAppPasswordSetting?.value;

    if (hrEmail && hrAppPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: hrEmail,
          pass: hrAppPassword,
        },
      });

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b;">New Employee Help Request</h2>
          <table style="width:100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 160px;"><strong>Employee ID</strong></td><td>${parsed.data.employeeId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Employee Name</strong></td><td>${parsed.data.employeeName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email</strong></td><td>${parsed.data.email || "N/A"}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Department</strong></td><td>${parsed.data.department}${parsed.data.subDepartment ? ` / ${parsed.data.subDepartment}` : ""}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone Number</strong></td><td>${parsed.data.phoneNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Issue Type</strong></td><td>${parsed.data.issueType}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Description:</strong></p>
            <p style="margin: 8px 0 0; color: #334155;">${parsed.data.description}</p>
          </div>
          <p style="margin-top: 16px; color: #94a3b8; font-size: 12px;">This request can be viewed and managed from the HR Dashboard → Employee Help section.</p>
        </div>
      `;

      await transporter.sendMail({
        from: hrEmail,
        to: hrEmail,
        subject: `Employee Help Request: ${parsed.data.issueType}`,
        html: emailHtml,
      });
    }
  } catch (err) {
    console.error("Failed to send HR help request email", err);
  }

  res.status(201).json({ message: "Help request submitted successfully", request: helpReq });
});

// HR views all help requests
router.get("/hr/help-requests", async (_req: any, res: any) => {
  const requests = await HelpRequest.find().sort({ createdAt: -1 });
  res.json(requests);
});

// HR updates help request status
router.put("/hr/help-requests/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["Pending", "In Progress", "Resolved"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const updated = await HelpRequest.findByIdAndUpdate(id, { status }, { new: true });
  
  if (updated && status === "Resolved" && updated.email) {
    try {
      const hrEmailSetting = await Setting.findOne({ key: "hrEmail" });
      const hrEmail = hrEmailSetting?.value;
      const hrAppPasswordSetting = await Setting.findOne({ key: "hrAppPassword" });
      const hrAppPassword = hrAppPasswordSetting?.value;

      if (hrEmail && hrAppPassword) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: hrEmail, pass: hrAppPassword },
        });

        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b;">Help Request Resolved</h2>
            <p style="color: #475569; font-size: 16px;">Hello <strong>${updated.employeeName}</strong>,</p>
            <p style="color: #475569; font-size: 14px;">Your help request regarding <strong>${updated.issueType}</strong> has been marked as resolved by HR.</p>
            <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Your Original Request:</strong></p>
              <p style="margin: 8px 0 0; color: #334155;">${updated.description}</p>
            </div>
            <p style="margin-top: 16px; color: #94a3b8; font-size: 12px;">If you still need assistance, please submit a new help request.</p>
          </div>
        `;

        await transporter.sendMail({
          from: hrEmail,
          to: updated.email,
          subject: `Resolved: ${updated.issueType}`,
          html: emailHtml,
        });
      }
    } catch (err) {
      console.error("Failed to send resolution email", err);
    }
  }

  res.json(updated);
});

// ─────────────────────────────────────────────
// HR CUSTOMER FEEDBACK VIEW
// ─────────────────────────────────────────────
router.get("/hr/customer-feedback", async (_req: any, res: any) => {
  const feedbacks = await CustomerFeedback.find().sort({ createdAt: -1 });
  res.json(feedbacks);
});

// ─────────────────────────────────────────────
// HR EMPLOYEE MANAGEMENT
// ─────────────────────────────────────────────
const hireEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  departmentId: z.string().min(1),
  subDepartment: z.string().optional(),
  designation: z.string().optional(),
  contactNumber: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  shift: z.string().optional(),
  monthlySalary: z.number().optional(),
});

// HR Employee Recruitment Endpoints

router.get("/hr/employee-requests", requireHR, async (req: any, res: any) => {
  const session = req.session as any;
  const hrUser = await User.findById(session.userId);
  if (!hrUser || !hrUser.departmentId) return res.status(403).json({ error: "Forbidden", message: "HR not associated with a department" });

  // Build query: always filter by department; if the HR has a sub-department, also filter by it
  const query: any = {
    accountStatus: { $in: ["Pending", "Denied"] },
    departmentId: hrUser.departmentId,
  };
  if (hrUser.subDepartment) {
    query.subDepartment = hrUser.subDepartment;
  }

  const requests = await Employee.find(query).sort({ createdAt: -1 });
  const enriched = await Promise.all(
    requests.map(async (emp: any) => {
      const dept = await Department.findById(emp.departmentId);
      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        departmentName: dept?.name ?? "Unknown",
        subDepartment: emp.subDepartment,
        contactNumber: emp.contactNumber,
        gender: emp.gender,
        location: emp.location,
        employmentType: emp.employmentType,
        accountStatus: emp.accountStatus,
        createdAt: emp.createdAt,
      };
    })
  );
  res.json(enriched);
});

router.post("/hr/employee-requests/:id/allow", requireHR, async (req: any, res: any) => {
  const { id } = req.params;
  const { shift, monthlySalary } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  if (!shift || !monthlySalary) return res.status(400).json({ error: "shift and monthlySalary are required" });

  const session = req.session as any;
  const hrUser = await HR.findById(session.userId);
  
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Not found" });
  
  const dept = await Department.findById(emp.departmentId);
  
  if (hrUser && emp.departmentId.toString() !== hrUser.departmentId?.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your department" });
  }
  if (hrUser && hrUser.subDepartmentId && emp.subDepartmentId && emp.subDepartmentId.toString() !== hrUser.subDepartmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
  }

  // Generate Employee ID
  let deptSymbol = "X";
  const deptName = (dept?.name || "").toLowerCase();
  if (deptName.includes("production")) deptSymbol = "P";
  else if (deptName.includes("marketing")) deptSymbol = "M";

  let subDeptSymbol = "X";
  const subDeptName = (emp.subDepartment || "").toLowerCase();
  if (subDeptName === "labour team") subDeptSymbol = "L";
  else if (subDeptName === "packaging team") subDeptSymbol = "P";
  else if (subDeptName === "machine operator") subDeptSymbol = "M";
  else if (subDeptName === "isr") subDeptSymbol = "I";
  else if (subDeptName === "sso") subDeptSymbol = "S"; // Note: S for SSO? Wait, user said SO="S", TSO="T", what about SSO? I will use S for SSO too or maybe 'S' for SSO and 'O' for SO. Wait, user said: "TSO="T", SO="S""
  // Let me look at the user request carefully: "SUB-DEPARTMENT: ISR="I", TSO="T", SO="S""
  // They didn't mention SSO symbol. Let's use 'O' for SSO or 'S' for SSO. Let's just use first letter of SSO -> S, SO -> S. It's fine.
  else if (subDeptName.includes("sso")) subDeptSymbol = "S";
  else if (subDeptName.includes("so")) subDeptSymbol = "S";
  else if (subDeptName.includes("tso")) subDeptSymbol = "T";

  const prefix = `EMP${deptSymbol}${subDeptSymbol}`;

  const existingEmps = await Employee.find({ employeeId: new RegExp(`^${prefix}\\d{4}$`, "i") });
  const usedNumbers = existingEmps
    .map(e => parseInt(e.employeeId!.replace(new RegExp(`^${prefix}`, "i"), ""), 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
    
  let sequence = 1;
  for (const num of usedNumbers) {
    if (num === sequence) sequence++;
    else if (num > sequence) break;
  }

  const generatedEmployeeId = `${prefix}${sequence.toString().padStart(4, "0")}`;

  emp.accountStatus = "Active";
  emp.status = "active";
  emp.employeeId = generatedEmployeeId;
  emp.shift = shift;
  emp.monthlySalary = monthlySalary;
  emp.joiningDate = new Date();
  await emp.save();

  try {
    await sendEmail(
      emp.email,
      "Employee Registration Approved - DS Engineosys",
      `Congratulations ${emp.name}! Your employee registration has been APPROVED by your Department HR.\n\nYour EMP-ID is ${generatedEmployeeId}.\nShift Assigned: ${shift}\nMonthly Salary: ${monthlySalary} INR\n\nYou can now proceed to set your password and access the platform.`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #059669;">Registration Approved!</h2>
        <p>Congratulations <strong>${emp.name}</strong>,</p>
        <p>Your employee registration has been APPROVED by your Department HR.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Employee ID:</strong> <span style="color: #2563eb;">${generatedEmployeeId}</span></p>
          <p style="margin: 5px 0;"><strong>Shift Assigned:</strong> ${shift}</p>
          <p style="margin: 5px 0;"><strong>Monthly Salary:</strong> ${monthlySalary} INR</p>
        </div>
        <p>You can now proceed to set your password and access the Employee Workspace.</p>
      </div>
      `
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify Employee of approval", err);
  }

  res.json({ message: "Employee approved", employee: emp });
});

router.post("/hr/employee-requests/:id/deny", requireHR, async (req: any, res: any) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

  const session = req.session as any;
  const hrUser = await User.findById(session.userId);

  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Not found" });
  
  if (hrUser && emp.departmentId.toString() !== hrUser.departmentId?.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your department" });
  }
  // Also check sub-department scope if HR has one assigned
  if (hrUser && hrUser.subDepartment && emp.subDepartment && emp.subDepartment !== hrUser.subDepartment) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
  }

  emp.accountStatus = "Denied";
  await emp.save();

  try {
    await sendEmail(
      emp.email,
      "Employee Registration Denied - DS Engineosys",
      `Hello ${emp.name}, your employee registration request has been DENIED by your Department HR.`
    );
  } catch (err) {
    console.error("Non-critical: Failed to notify Employee of denial", err);
  }

  res.json({ message: "Employee denied", employee: emp });
});

router.post("/hr/employees", async (req: any, res: any) => {
  try {
    const parsed = hireEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    }

    if (!mongoose.Types.ObjectId.isValid(parsed.data.departmentId)) {
      return res.status(400).json({ error: "Invalid input", message: "Department ID must be a valid 24-character MongoDB ObjectId." });
    }

    const existing = await Employee.findOne({ $or: [{ email: parsed.data.email }, { employeeId: parsed.data.employeeId }] });
    if (existing) {
      return res.status(409).json({ error: "Duplicate", message: "An employee with this ID or email already exists." });
    }

    const dept = await Department.findById(parsed.data.departmentId);
    if (!dept) {
      return res.status(404).json({ error: "Not Found", message: "Selected Department does not exist." });
    }

    const emp = await Employee.create({
      ...parsed.data,
      designation: parsed.data.designation || "Employee",
      joiningDate: new Date(),
      status: "active",
      accountStatus: "Active",
      departmentId: new mongoose.Types.ObjectId(parsed.data.departmentId),
    });

    res.status(201).json({ message: "Employee hired successfully", employee: emp });
  } catch (error: any) {
    console.error("Error hiring employee:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

router.get("/hr/employees", async (_req: any, res: any) => {
  const employees = await Employee.find().sort({ createdAt: -1 });
  const enriched = await Promise.all(
    employees.map(async (emp: any) => {
      const dept = await Department.findById(emp.departmentId);
      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        departmentName: dept?.name ?? "Unknown",
        subDepartment: emp.subDepartment,
        designation: emp.designation,
        contactNumber: emp.contactNumber,
        gender: emp.gender,
        location: emp.location,
        employmentType: emp.employmentType,
        shift: emp.shift,
        monthlySalary: emp.monthlySalary,
        accountStatus: emp.accountStatus || "Active",
        joiningDate: emp.joiningDate,
      };
    })
  );
  res.json(enriched);
});

router.put("/hr/employees/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  const { accountStatus } = req.body;
  if (!["Active", "Inactive"].includes(accountStatus)) {
    return res.status(400).json({ error: "Invalid status. Must be Active or Inactive." });
  }
  const updated = await Employee.findByIdAndUpdate(id, { accountStatus }, { new: true });
  if (!updated) return res.status(404).json({ error: "Employee not found" });
  res.json({ message: `Employee ${accountStatus.toLowerCase()}d`, employee: updated });
});

router.delete("/hr/employees/:id", async (req: any, res: any) => {
  const { id } = req.params;
  await Employee.findByIdAndDelete(id);
  res.json({ message: "Employee deleted" });
});

router.put("/hr/employees/:id/reset-password", async (req: any, res: any) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  const updated = await Employee.findByIdAndUpdate(id, { password: newPassword }, { new: true });
  if (!updated) return res.status(404).json({ error: "Employee not found" });
  res.json({ message: "Password reset successfully" });
});

// ─────────────────────────────────────────────
// HR PRODUCT MANAGEMENT
// ─────────────────────────────────────────────
const addProductSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
  manufactureDate: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  mrp: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
});

router.post("/hr/products", async (req: any, res: any) => {
  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", message: parsed.error.message });
  }

  const product = await Product.create({
    ...parsed.data,
    soldUnits: 0,
    revenue: 0,
    status: "active",
    marketStatus: "moderate",
    manufactureDate: parsed.data.manufactureDate ? new Date(parsed.data.manufactureDate) : undefined,
    expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
  });

  res.status(201).json({ message: "Product added successfully", product });
});

router.get("/hr/products", async (_req: any, res: any) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.put("/hr/products/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be active or inactive" });
  }
  const updated = await Product.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) return res.status(404).json({ error: "Product not found" });
  res.json({ message: `Product ${status}`, product: updated });
});

// ─────────────────────────────────────────────
// HR EMAIL SETTINGS (SMTP Config)
// ─────────────────────────────────────────────
router.put("/hr/settings/email", async (req: any, res: any) => {
  const { hrEmail, hrAppPassword } = req.body;
  if (!hrEmail) return res.status(400).json({ error: "HR email is required" });

  await Setting.findOneAndUpdate({ key: "hrEmail" }, { key: "hrEmail", value: hrEmail }, { upsert: true });
  if (hrAppPassword) {
    await Setting.findOneAndUpdate({ key: "hrAppPassword" }, { key: "hrAppPassword", value: hrAppPassword }, { upsert: true });
  }
  res.json({ message: "HR email settings saved" });
});

router.get("/hr/settings/email", async (_req: any, res: any) => {
  const hrEmailSetting = await Setting.findOne({ key: "hrEmail" });
  const hrAppPasswordSetting = await Setting.findOne({ key: "hrAppPassword" });
  res.json({
    hrEmail: hrEmailSetting?.value || "",
    hrAppPassword: hrAppPasswordSetting?.value || "",
  });
});

export default router;
