import { Router } from "express";
import Employee from "../models/employee.model";
import Task from "../models/task.model";
import Product from "../models/product.model";
import Bonus from "../models/bonus.model";
import CustomerFeedback from "../models/customer-feedback.model";
import DailyCollection from "../models/daily-collection.model";
import Setting from "../models/setting.model";
import Department from "../models/department.model";

const router = Router();

function requireEmployee(req: any, res: any, next: any) {
  const session = req.session as any;
  if (!session.userId || session.role !== "employee") {
    return res.status(401).json({ error: "Unauthorized", message: "Employee login required" });
  }
  next();
}

// Employee profile
router.get("/employee/me", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const emp = await Employee.findById(session.userId);
  if (!emp) return res.status(404).json({ error: "Employee not found" });
  const dept = await Department.findById(emp.departmentId);
  res.json({
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
    avatarUrl: emp.avatarUrl,
    performanceScore: emp.performanceScore,
    joiningDate: emp.joiningDate,
  });
});

// Assigned tasks for the employee
router.get("/employee/tasks", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const tasks = await Task.find({ employeeId: session.userId }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Active products visible to employee
router.get("/employee/products", async (_req: any, res: any) => {
  const products = await Product.find({ status: "active" }).sort({ createdAt: -1 });
  res.json(products);
});

// Employee performance stats
router.get("/employee/performance", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const emp = await Employee.findById(session.userId);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const tasks = await Task.find({ employeeId: session.userId });
  const total = tasks.length;
  const completed = tasks.filter((t: any) => t.status === "completed").length;
  const taskPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Bonus points for this month
  const now = new Date();
  const bonuses = await Bonus.find({ assignedTo: session.userId });
  const bonusPoints = bonuses.length * 10;

  res.json({
    taskPercent,
    performancePoints: emp.performanceScore ?? 0,
    bonusPoints,
    totalTasks: total,
    completedTasks: completed,
  });
});

// Assigned bonuses for employee
router.get("/employee/bonuses", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const bonuses = await Bonus.find({ assignedTo: session.userId }).sort({ createdAt: -1 });
  res.json(bonuses);
});

// Submit customer feedback
router.post("/employee/feedback", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const { customerName, feedback, rating } = req.body;
  if (!feedback) return res.status(400).json({ error: "Feedback is required" });

  const emp = await Employee.findById(session.userId);
  const fb = await CustomerFeedback.create({
    employeeId: emp?.employeeId || session.userId,
    employeeName: emp?.name || "Unknown",
    customerName,
    feedback,
    rating,
  });

  res.status(201).json({ message: "Feedback submitted", feedback: fb });
});

// Company name from settings
router.get("/employee/company", async (_req: any, res: any) => {
  const setting = await Setting.findOne({ key: "companyName" });
  res.json({ companyName: setting?.value || "DS Engineosys" });
});

// Record a product sale (with proof)
router.post("/employee/sell", requireEmployee, async (req: any, res: any) => {
  const session = req.session as any;
  const { productId, quantity, taskId, proofImageUrl, customerDetails } = req.body;
  if (!productId || !quantity) return res.status(400).json({ error: "productId and quantity are required" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.stock < quantity) return res.status(400).json({ error: "Insufficient stock" });

  const saleAmount = product.price * quantity;
  product.stock -= quantity;
  product.soldUnits += quantity;
  product.revenue = (product.revenue || 0) + saleAmount;
  await product.save();

  // Save daily collection entry
  const today = new Date().toISOString().split("T")[0];
  await DailyCollection.create({
    date: today,
    type: "product",
    data: {
      employeeId: session.userId,
      productId,
      productName: product.name,
      quantity,
      saleAmount,
      taskId,
      proofImageUrl,
      customerDetails,
      timestamp: new Date().toISOString(),
    },
  });

  res.json({ message: "Sale recorded successfully", saleAmount, remainingStock: product.stock });
});

export default router;
