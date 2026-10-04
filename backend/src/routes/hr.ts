import { Router } from "express";
import Employee from "../models/employee.model";
import Product from "../models/product.model";
import HelpRequest from "../models/help-request.model";
import CustomerFeedback from "../models/customer-feedback.model";
import Setting from "../models/setting.model";
import Department from "../models/department.model";
import SubDepartment from "../models/sub-department.model";
import { sendEmail } from "../lib/email";
import { formatProduct } from "./products";
import { checkAndCleanExpiredProductOffers } from "../services/product-offer-cleaner";
import { z } from "zod";
import mongoose from "mongoose";
import HR from "../models/hr.model";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "src", "data", "ProductImages");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temp-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

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
    const hrEmailSetting = await Setting.findOne({ key: "hrEmail" }) || await Setting.findOne({ key: "smtpUser" });
    const hrEmail = hrEmailSetting?.value;
    if (hrEmail) {
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
      await sendEmail(
        hrEmail,
        `Employee Help Request: ${parsed.data.issueType}`,
        `Employee Help Request from ${parsed.data.employeeName}: ${parsed.data.description}`,
        emailHtml
      );
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
  const updated = await HelpRequest.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
  
  if (updated && status === "Resolved" && updated.email) {
    try {
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
      await sendEmail(
        updated.email,
        `Resolved: ${updated.issueType}`,
        `Hello ${updated.employeeName}, your help request regarding ${updated.issueType} has been resolved by HR.`,
        emailHtml
      );
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
  try {
    const session = req.session as any;
    const hrUser = await HR.findById(session.userId);

    const query: any = {
      accountStatus: { $in: ["Pending", "pending", "Denied", "denied"] },
    };

    if (hrUser && hrUser.departmentId) {
      const deptIdStr = hrUser.departmentId.toString();
      const deptObjId = mongoose.Types.ObjectId.isValid(deptIdStr) ? new mongoose.Types.ObjectId(deptIdStr) : null;
      const possibleDeptValues: any[] = [deptIdStr];
      if (deptObjId) possibleDeptValues.push(deptObjId);

      try {
        const deptDoc = await Department.findById(hrUser.departmentId);
        if (deptDoc) {
          possibleDeptValues.push(deptDoc.name);
          possibleDeptValues.push(deptDoc._id);
        }
      } catch (e) {}

      query.departmentId = { $in: possibleDeptValues };

      if (hrUser.subDepartmentId) {
        const subDeptIdStr = hrUser.subDepartmentId.toString();
        const subDeptObjId = mongoose.Types.ObjectId.isValid(subDeptIdStr) ? new mongoose.Types.ObjectId(subDeptIdStr) : null;
        const possibleSubDeptValues: any[] = [subDeptIdStr];
        if (subDeptObjId) possibleSubDeptValues.push(subDeptObjId);
        
        try {
          const sd = await SubDepartment.findById(hrUser.subDepartmentId);
          if (sd) {
            possibleSubDeptValues.push(sd.name);
            possibleSubDeptValues.push(sd.name.toLowerCase());
          }
        } catch (e) {}

        // HR has a sub-department: show employees in that sub-dept OR those with no sub-dept
        query.$or = [
          { subDepartmentId: { $in: possibleSubDeptValues } },
          { subDepartmentId: { $exists: false } },
          { subDepartmentId: null },
          { subDepartmentId: "" }
        ];
      }
      // If HR has no subDepartmentId, show ALL employees in the department (no $or filter needed)
    }

    const requests = await Employee.find(query).sort({ createdAt: -1 });
    const enriched = await Promise.all(
      requests.map(async (emp: any) => {
        let deptName = "General / Unassigned";
        if (emp.departmentId) {
          if (mongoose.Types.ObjectId.isValid(emp.departmentId)) {
            try {
              const d = await Department.findById(emp.departmentId);
              if (d) deptName = d.name;
              else deptName = String(emp.departmentId);
            } catch (e) {
              deptName = String(emp.departmentId);
            }
          } else {
            deptName = String(emp.departmentId);
          }
        }

        let subDeptName = "";
        if (emp.subDepartmentId) {
          if (mongoose.Types.ObjectId.isValid(emp.subDepartmentId)) {
            try {
              const subDeptDoc = await SubDepartment.findById(emp.subDepartmentId);
              if (subDeptDoc) subDeptName = subDeptDoc.name;
              else subDeptName = String(emp.subDepartmentId);
            } catch (err) {
              subDeptName = String(emp.subDepartmentId);
            }
          } else {
            subDeptName = String(emp.subDepartmentId);
          }
        }
        return {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          departmentName: deptName,
          subDepartment: subDeptName,
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
  } catch (err: any) {
    console.error("Error fetching HR employee requests:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
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
  
  const dept = (mongoose.Types.ObjectId.isValid(String(emp.departmentId)) ? await Department.findById(emp.departmentId) : null) || await Department.findOne({ name: String(emp.departmentId) });
  
  // Verify department match flexibly
  if (hrUser && hrUser.departmentId) {
    const hrDeptStr = hrUser.departmentId.toString();
    const empDeptStr = emp.departmentId?.toString() || "";
    let isDeptMatch = hrDeptStr === empDeptStr;
    if (!isDeptMatch && dept) {
      isDeptMatch = (dept._id.toString() === hrDeptStr);
    }
    if (!isDeptMatch) {
      const hrDept = await Department.findById(hrUser.departmentId);
      if (hrDept && dept && hrDept.name.toLowerCase() === dept.name.toLowerCase()) {
        isDeptMatch = true;
      }
    }
    if (!isDeptMatch) {
      return res.status(403).json({ error: "Forbidden", message: "Employee is not in your assigned department" });
    }
  }

  // Generate Employee ID
  let deptSymbol = "X";
  const deptName = (dept?.name || "").toLowerCase();
  if (deptName.includes("production")) deptSymbol = "P";
  else if (deptName.includes("marketing")) deptSymbol = "M";

  let subDeptSymbol = "X";
  let subDeptName = "";
  if (emp.subDepartmentId) {
    if (mongoose.Types.ObjectId.isValid(emp.subDepartmentId)) {
      const subDeptDoc = await SubDepartment.findById(emp.subDepartmentId);
      if (subDeptDoc) {
        subDeptName = subDeptDoc.name.toLowerCase();
      }
    } else {
      subDeptName = String(emp.subDepartmentId).toLowerCase();
    }
  }

  if (subDeptName.includes("labour")) subDeptSymbol = "L";
  else if (subDeptName.includes("packaging")) subDeptSymbol = "P";
  else if (subDeptName.includes("machine")) subDeptSymbol = "M";
  else if (subDeptName.includes("isr")) subDeptSymbol = "I";
  else if (subDeptName === "tso" || subDeptName.includes("tso")) subDeptSymbol = "T";
  else if (subDeptName === "so" || subDeptName.includes("so") || subDeptName.includes("sso")) subDeptSymbol = "S";

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
      "Employee Registration Approved",
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
  const hrUser = await HR.findById(session.userId);

  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Not found" });

  // Auth check BEFORE modifying the record
  if (hrUser && hrUser.departmentId) {
    const hrDeptStr = hrUser.departmentId.toString();
    const empDeptStr = emp.departmentId?.toString() || "";
    let isDeptMatch = hrDeptStr === empDeptStr;
    if (!isDeptMatch) {
      const hrDept = await Department.findById(hrUser.departmentId);
      const empDept = mongoose.Types.ObjectId.isValid(empDeptStr) ? await Department.findById(emp.departmentId) : null;
      if (hrDept && empDept && hrDept.name.toLowerCase() === empDept.name.toLowerCase()) isDeptMatch = true;
    }
    if (!isDeptMatch) {
      return res.status(403).json({ error: "Forbidden", message: "Employee is not in your assigned department" });
    }
    // Also check sub-department scope if HR has one assigned
    if (hrUser.subDepartmentId && emp.subDepartmentId && emp.subDepartmentId.toString() !== hrUser.subDepartmentId.toString()) {
      return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
    }
  }

  emp.accountStatus = "Denied";
  await emp.save();

  try {
    await sendEmail(
      emp.email,
      "Employee Registration Denied",
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

router.get("/hr/employees", requireHR, async (req: any, res: any) => {
  const session = req.session as any;
  const hrUser = await HR.findById(session.userId);
  if (!hrUser) return res.status(403).json({ error: "Forbidden", message: "HR not found" });

  const query: any = {
    accountStatus: { $nin: ["Pending", "Denied"] },
  };
  if (hrUser.departmentId) {
    query.departmentId = new mongoose.Types.ObjectId(hrUser.departmentId.toString());
  }
  if (hrUser.subDepartmentId) {
    query.subDepartmentId = new mongoose.Types.ObjectId(hrUser.subDepartmentId.toString());
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 });
  const enriched = await Promise.all(
    employees.map(async (emp: any) => {
      const dept = emp.departmentId ? await Department.findById(emp.departmentId) : null;
      let subDeptName = "";
      if (emp.subDepartmentId && mongoose.Types.ObjectId.isValid(emp.subDepartmentId)) {
        try {
          const subDeptDoc = await SubDepartment.findById(emp.subDepartmentId);
          if (subDeptDoc) subDeptName = subDeptDoc.name;
        } catch (err) {
          console.error("Invalid subDepartmentId:", emp.subDepartmentId);
        }
      }
      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        departmentName: dept?.name ?? "Unknown",
        subDepartment: subDeptName,
        designation: emp.designation,
        contactNumber: emp.contactNumber,
        gender: emp.gender,
        location: emp.location,
        employmentType: emp.employmentType,
        shift: emp.shift,
        monthlySalary: emp.monthlySalary,
        accountStatus: emp.accountStatus === "Approved" ? "Active" : (emp.accountStatus || "Active"),
        joiningDate: emp.joiningDate,
      };
    })
  );
  res.json(enriched);
});

router.put("/hr/employees/:id/status", requireHR, async (req: any, res: any) => {
  const { id } = req.params;
  const { accountStatus } = req.body;
  if (!["Active", "Inactive"].includes(accountStatus)) {
    return res.status(400).json({ error: "Invalid status. Must be Active or Inactive." });
  }
  const session = req.session as any;
  const hrUser = await HR.findById(session.userId);
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  if (hrUser?.departmentId && emp.departmentId?.toString() !== hrUser.departmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your department" });
  }
  if (hrUser?.subDepartmentId && emp.subDepartmentId && emp.subDepartmentId.toString() !== hrUser.subDepartmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
  }

  emp.accountStatus = accountStatus;
  emp.status = accountStatus.toLowerCase() === "inactive" ? "inactive" : "active";
  await emp.save();
  res.json({ message: `Employee ${accountStatus}d`, employee: emp });
});

router.delete("/hr/employees/:id", requireHR, async (req: any, res: any) => {
  const { id } = req.params;
  const session = req.session as any;
  const hrUser = await HR.findById(session.userId);
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  if (hrUser?.departmentId && emp.departmentId?.toString() !== hrUser.departmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your department" });
  }
  if (hrUser?.subDepartmentId && emp.subDepartmentId && emp.subDepartmentId.toString() !== hrUser.subDepartmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
  }

  await Employee.findByIdAndDelete(id);
  res.json({ message: "Employee deleted" });
});

router.put("/hr/employees/:id/reset-password", requireHR, async (req: any, res: any) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  const session = req.session as any;
  const hrUser = await HR.findById(session.userId);
  const emp = await Employee.findById(id);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  if (hrUser?.departmentId && emp.departmentId?.toString() !== hrUser.departmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your department" });
  }
  if (hrUser?.subDepartmentId && emp.subDepartmentId && emp.subDepartmentId.toString() !== hrUser.subDepartmentId.toString()) {
    return res.status(403).json({ error: "Forbidden", message: "Employee is not in your sub-department" });
  }

  emp.password = newPassword;
  await emp.save();
  res.json({ message: "Password reset successfully" });
});

// ─────────────────────────────────────────────
// HR PRODUCT & STOCKING MANAGEMENT
// ─────────────────────────────────────────────
function getJsonDataPath(filename: string) {
  return path.resolve(process.cwd(), "src/data", filename);
}

function appendToProductsJson(newProd: any) {
  try {
    const jsonPath = getJsonDataPath("products.json");
    let list: any[] = [];
    if (fs.existsSync(jsonPath)) {
      list = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }
    const cleanItem = {
      productId: newProd.productId,
      productName: newProd.name || newProd.productName,
      category: newProd.category,
      subCategory: newProd.subCategory || "",
      type: newProd.type || "",
      gender: newProd.gender || "Both",
      ageGroup: newProd.ageGroup || "All Ages",
      batchNumber: newProd.batchNumber || "",
      discountPercent: Number(newProd.discountPercent || 0),
      taxPercent: Number(newProd.taxPercent || 18),
      mrp: Number(newProd.mrp || newProd.price || 0),
      sellingPrice: Number(newProd.price || newProd.sellingPrice || 0),
      ingredients: newProd.ingredients || [],
      productDescription: newProd.description || newProd.productDescription || "",
      image: newProd.imageUrl || newProd.image || `images/${newProd.productId}.jpg`
    };
    const idx = list.findIndex(p => p.productId === cleanItem.productId);
    if (idx >= 0) {
      list[idx] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to products.json:", err);
  }
}

function appendToStockProductsJson(stockItem: any) {
  try {
    const jsonPath = getJsonDataPath("Stockproducts.json");
    let list: any[] = [];
    if (fs.existsSync(jsonPath)) {
      list = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }
    const cleanItem = {
      productId: stockItem.productId,
      productName: stockItem.name || stockItem.productName,
      category: stockItem.category,
      subCategory: stockItem.subCategory || "",
      type: stockItem.type || "",
      gender: stockItem.gender || "Both",
      ageGroup: stockItem.ageGroup || "All Ages",
      batchNumber: stockItem.batchNumber || "",
      manufactureDate: stockItem.manufactureDate || "",
      expiryDate: stockItem.expiryDate || "",
      stockQuantity: Number(stockItem.stockQuantity || stockItem.stock || 0),
      discountPercent: Number(stockItem.discountPercent || 0),
      taxPercent: Number(stockItem.taxPercent || 18),
      mrp: Number(stockItem.mrp || stockItem.price || 0),
      sellingPrice: Number(stockItem.price || stockItem.sellingPrice || 0),
      ingredients: stockItem.ingredients || [],
      productDescription: stockItem.description || stockItem.productDescription || "",
      image: stockItem.imageUrl || stockItem.image || `images/${stockItem.productId}.jpg`
    };
    const idx = list.findIndex(p => p.productId === cleanItem.productId);
    if (idx >= 0) {
      list[idx] = cleanItem;
    } else {
      list.push(cleanItem);
    }
    fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to Stockproducts.json:", err);
  }
}

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
  batchNumber: z.string().optional(),
  mrp: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  price: z.number().min(0),
});

const addStockSchema = z.object({
  productId: z.string().min(1),
  manufactureDate: z.string().min(1),
  expiryDate: z.string().min(1),
  stockQuantity: z.number().min(1),
});

router.post("/hr/products", upload.single("image"), async (req: any, res: any) => {
  // Convert fields from strings if FormData was used
  if (typeof req.body.price === "string") req.body.price = Number(req.body.price);
  if (typeof req.body.mrp === "string") req.body.mrp = Number(req.body.mrp);
  if (typeof req.body.discountPercent === "string") req.body.discountPercent = Number(req.body.discountPercent);
  if (typeof req.body.taxPercent === "string") req.body.taxPercent = Number(req.body.taxPercent);

  const parsed = addProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", message: parsed.error.message });
  }

  let generatedId = parsed.data.productId;
  if (!generatedId) {
    const count = await Product.countDocuments();
    generatedId = `PROD-${(count + 1).toString().padStart(6, "0")}`;
  }

  let imageUrl = "";
  if (req.file) {
    const ext = path.extname(req.file.originalname);
    const newFilename = `${generatedId}${ext}`;
    const newPath = path.join(req.file.destination, newFilename);
    fs.renameSync(req.file.path, newPath);
    imageUrl = `/api/images/${newFilename}`;
  }

  const productData = {
    ...parsed.data,
    productId: generatedId,
    sku: generatedId,
    stock: 0,
    soldUnits: 0,
    revenue: 0,
    status: "active",
    marketStatus: "moderate" as const,
    imageUrl: imageUrl || undefined,
  };

  const product = await Product.create(productData);

  // Append new product to products.json (without manufactureDate, expiryDate, stockQuantity)
  appendToProductsJson({
    ...productData,
    _id: product._id,
  });

  res.status(201).json({ message: "Product added successfully to products.json and DB", product: formatProduct(product) });
});

router.post("/hr/stocking", async (req: any, res: any) => {
  const parsed = addStockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", message: parsed.error.message });
  }

  const { productId, manufactureDate, expiryDate, stockQuantity } = parsed.data;

  let product: any = await Product.findOne({ $or: [{ productId }, { sku: productId }, { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : null }] });

  if (!product) {
    const jsonPath = getJsonDataPath("products.json");
    if (fs.existsSync(jsonPath)) {
      const list = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const found = list.find((p: any) => p.productId === productId);
      if (found) {
        product = found;
      }
    }
  }

  if (!product) {
    return res.status(404).json({ error: "Not found", message: "Product not found" });
  }

  // Parse dates safely
  let mfgDateObj: Date | undefined;
  let expDateObj: Date | undefined;
  if (manufactureDate) {
    const parts = manufactureDate.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      mfgDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      mfgDateObj = new Date(manufactureDate);
    }
  }
  if (expiryDate) {
    const parts = expiryDate.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      expDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      expDateObj = new Date(expiryDate);
    }
  }

  // Update stock in DB
  const newStock = (product.stock || 0) + stockQuantity;
  if (product._id) {
    await Product.findByIdAndUpdate(product._id, {
      stock: newStock,
      manufactureDate: mfgDateObj,
      expiryDate: expDateObj,
    });
  }

  // Format DD-MM-YYYY strings for Stockproducts.json
  const formatDDMMYYYY = (d?: Date, origStr?: string) => {
    if (d && !isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return origStr || "";
  };

  const formattedMfg = formatDDMMYYYY(mfgDateObj, manufactureDate);
  const formattedExp = formatDDMMYYYY(expDateObj, expiryDate);

  const stockItem = {
    productId: product.productId || productId,
    productName: product.name || product.productName,
    category: product.category,
    subCategory: product.subCategory || "",
    type: product.type || "",
    gender: product.gender || "Both",
    ageGroup: product.ageGroup || "All Ages",
    batchNumber: product.batchNumber || `B${new Date().getFullYear().toString().slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`,
    manufactureDate: formattedMfg,
    expiryDate: formattedExp,
    stockQuantity: stockQuantity,
    discountPercent: product.discountPercent || 0,
    taxPercent: product.taxPercent || 18,
    mrp: product.mrp || product.price || 0,
    sellingPrice: product.price || product.sellingPrice || 0,
    ingredients: product.ingredients || [],
    productDescription: product.description || product.productDescription || "",
    image: product.imageUrl || product.image || `images/${product.productId || productId}.jpg`
  };

  appendToStockProductsJson(stockItem);

  res.json({ message: "Product stock added to Stockproducts.json successfully", stockItem });
});

router.get("/hr/products", async (_req: any, res: any) => {
  await checkAndCleanExpiredProductOffers();
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products.map(formatProduct));
});

router.put("/hr/products/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be active or inactive" });
  }
  const updated = await Product.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
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
