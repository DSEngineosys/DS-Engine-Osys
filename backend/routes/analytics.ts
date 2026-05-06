import { Router } from "express";
import Employee from "../models/employee.model";
import Task from "../models/task.model";
import Performance from "../models/performance.model";
import Product from "../models/product.model";
import Department from "../models/department.model";
import mongoose from "mongoose";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ status: "active" });
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: "completed" });
  const pendingTasks = await Task.countDocuments({ status: "pending" });
  const totalProducts = await Product.countDocuments();
  const highDemandProducts = await Product.countDocuments({ marketStatus: "high_demand" });
  const lowDemandProducts = await Product.countDocuments({ marketStatus: "low_demand" });

  const avgPerfResult = await Performance.aggregate([
    { $group: { _id: null, avgScore: { $avg: "$score" } } }
  ]);
  const avgPerformanceScore = avgPerfResult.length > 0 ? avgPerfResult[0].avgScore : 0;

  const revenueResult = await Product.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$revenue" } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  res.json({
    totalEmployees,
    activeEmployees,
    totalTasks,
    completedTasks,
    pendingTasks,
    totalProducts,
    highDemandProducts,
    lowDemandProducts,
    avgPerformanceScore,
    totalRevenue,
  });
});

router.get("/analytics/employee-performance", async (req, res) => {
  const departments = await Department.find();
  const result = await Promise.all(departments.map(async (dept) => {
    const employees = await Employee.find({ departmentId: dept._id });
    const empIds = employees.map(e => e._id);

    const completedCount = await Task.countDocuments({ 
      employeeId: { $in: empIds }, 
      status: "completed" 
    });
    const pendingCount = await Task.countDocuments({ 
      employeeId: { $in: empIds }, 
      status: "pending" 
    });

    const perfRecords = await Performance.aggregate([
      { $match: { employeeId: { $in: empIds } } },
      { $group: { _id: null, avgScore: { $avg: "$score" }, avgEff: { $avg: "$efficiency" } } }
    ]);

    return {
      departmentId: dept._id,
      departmentName: dept.name,
      avgScore: perfRecords.length > 0 ? Number(perfRecords[0].avgScore) : 75,
      totalEmployees: employees.length,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      efficiency: perfRecords.length > 0 ? Number(perfRecords[0].avgEff) : 80,
    };
  }));
  res.json(result);
});

router.get("/analytics/product-ranking", async (req, res) => {
  const products = await Product.find().sort({ revenue: -1 });
  
  const result = products.map((p, i) => {
    const price = Number(p.price);
    const cost = Number(p.cost);
    const revenue = Number(p.revenue);
    const profitMargin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const score = revenue * 0.6 + price * 0.4;
    const trend = p.marketStatus === "high_demand" ? "rising"
      : p.marketStatus === "critical" || p.marketStatus === "low_demand" ? "declining"
      : "stable";
    const recommendation = p.marketStatus === "low_demand" || p.marketStatus === "critical"
      ? "Apply discount to boost sales"
      : p.marketStatus === "high_demand"
      ? "Increase stock — high demand"
      : "Maintain current strategy";

    return {
      productId: p._id,
      productName: p.name,
      rank: i + 1,
      score: Math.round(score),
      revenue,
      soldUnits: p.soldUnits,
      profitMargin: Math.round(profitMargin * 10) / 10,
      trend,
      recommendation,
    };
  });

  res.json(result);
});

router.get("/analytics/product-prediction/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const prod = await Product.findById(id);
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }

  const price = Number(prod.price);
  const cost = Number(prod.cost);
  const profitMargin = price > 0 ? ((price - cost) / price) * 100 : 0;

  let predictedDemand: "high" | "medium" | "low" = "medium";
  let marketLongevityMonths = 12;
  let recommendation: "keep" | "offer_discount" | "discontinue" | "promote" = "keep";
  let suggestedOfferPercentage: number | null = null;
  const insights: string[] = [];

  if (prod.marketStatus === "high_demand") {
    predictedDemand = "high";
    marketLongevityMonths = 24;
    recommendation = "keep";
    insights.push("Product is performing strongly in the market");
    insights.push("High sales velocity — consider increasing stock");
    insights.push(`Profit margin of ${profitMargin.toFixed(1)}% is sustainable`);
  } else if (prod.marketStatus === "moderate") {
    predictedDemand = "medium";
    marketLongevityMonths = 18;
    recommendation = "promote";
    insights.push("Product shows moderate performance");
    insights.push("Consider promotional campaigns to boost visibility");
    insights.push("Market position can be improved with targeted offers");
  } else if (prod.marketStatus === "low_demand") {
    predictedDemand = "low";
    marketLongevityMonths = 6;
    recommendation = "offer_discount";
    suggestedOfferPercentage = 15;
    insights.push("Low demand detected — intervention recommended");
    insights.push("A 15% discount could boost sales by an estimated 30-40%");
    insights.push("Similar to D-Mart strategy: competitive pricing drives volume");
  } else {
    predictedDemand = "low";
    marketLongevityMonths = 3;
    recommendation = "offer_discount";
    suggestedOfferPercentage = 25;
    insights.push("Critical performance — immediate action required");
    insights.push("25% discount recommended to clear inventory");
    insights.push("Product may be discontinued if no improvement in 3 months");
  }

  const profitScore = Math.min(100, Math.max(0, profitMargin * 1.2 + prod.soldUnits * 0.1));

  res.json({
    productId: prod._id,
    productName: prod.name,
    predictedDemand,
    marketLongevityMonths,
    profitScore: Math.round(profitScore * 10) / 10,
    recommendation,
    suggestedOfferPercentage,
    confidence: 0.85,
    insights,
  });
});

router.get("/analytics/task-completion", async (req, res) => {
  const total = await Task.countDocuments();
  const completed = await Task.countDocuments({ status: "completed" });
  const inProgress = await Task.countDocuments({ status: "in_progress" });
  const pending = await Task.countDocuments({ status: "pending" });
  const failed = await Task.countDocuments({ status: "failed" });

  const departments = await Department.find();
  const byDepartment = await Promise.all(departments.map(async (dept) => {
    const employees = await Employee.find({ departmentId: dept._id });
    const empIds = employees.map(e => e._id);

    const deptCompleted = await Task.countDocuments({ 
      employeeId: { $in: empIds }, 
      status: "completed" 
    });
    const deptTotal = await Task.countDocuments({ 
      employeeId: { $in: empIds } 
    });

    return {
      departmentName: dept.name,
      completed: deptCompleted,
      total: deptTotal,
    };
  }));

  res.json({
    total,
    completed,
    inProgress,
    pending,
    failed,
    completionRate: total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0,
    byDepartment,
  });
});

export default router;
