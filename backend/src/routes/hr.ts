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
import nodemailer from "nodemailer";

const router = Router();

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
