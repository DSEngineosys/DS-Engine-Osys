import { Router } from "express";
import Employee from "../models/employee.model";
import Task from "../models/task.model";
import Performance from "../models/performance.model";
import Product from "../models/product.model";
import Department from "../models/department.model";
import mongoose from "mongoose";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load analytics dashboard", message: err.message });
  }
});

router.get("/analytics/employee-performance", async (req, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load employee performance", message: err.message });
  }
});

router.get("/analytics/product-ranking", async (req, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load product ranking", message: err.message });
  }
});

router.get("/analytics/product-prediction/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let prod = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      prod = await Product.findById(id);
    }
    if (!prod) {
      prod = await Product.findOne({ $or: [{ productId: id }, { sku: id }] });
    }
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load product prediction", message: err.message });
  }
});

router.get("/analytics/task-completion", async (req, res) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load task completion", message: err.message });
  }
});

import fs from "fs";
import path from "path";
import EmployeeDailyPerformance from "../models/employee-daily-performance.model";

router.get("/analytics/employee-daily-performance", async (req, res) => {
  try {
    const fromDate = (req.query.fromDate as string) || "2024-01-01";
    const toDate = (req.query.toDate as string) || "2024-01-31";

    let records: any[] = [];

    try {
      const dbDocs = await EmployeeDailyPerformance.find({
        date: { $gte: fromDate, $lte: toDate }
      }).sort({ date: 1 });

      if (dbDocs && dbDocs.length > 0) {
        for (const doc of dbDocs) {
          if (Array.isArray(doc.data)) {
            records.push(...doc.data);
          } else if (doc.data) {
            records.push(doc.data);
          }
        }
      }
    } catch (e) {
      console.warn("MongoDB query failed for EmployeeDailyPerformance, using fallback:", e);
    }

    if (records.length === 0) {
      const jsonPath = path.resolve(__dirname, "..", "data", "employeedailyperformances.json");
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const all = JSON.parse(raw);
        records = all.filter((r: any) => r.date >= fromDate && r.date <= toDate);
      }
    }

    // Group records by date to calculate all employees average for each day
    const dateMap = new Map<string, { totalHours: number; totalTasks: number; empCount: number }>();

    for (const r of records) {
      const dateStr = r.date;
      if (!dateStr) continue;

      const hours = Number(r.totalWorkspaceHours || 0);
      const tasks = Number(r.tasksCompleted || 0);

      const cur = dateMap.get(dateStr) || { totalHours: 0, totalTasks: 0, empCount: 0 };
      cur.totalHours += hours;
      cur.totalTasks += tasks;
      cur.empCount += 1;
      dateMap.set(dateStr, cur);
    }

    // Calculate average for each day and sort by totalWorkspaceHours (X-axis)
    const chartData = Array.from(dateMap.entries())
      .map(([date, item]) => {
        const avgHours = item.empCount > 0 ? Number((item.totalHours / item.empCount).toFixed(2)) : 0;
        const avgTasks = item.empCount > 0 ? Number((item.totalTasks / item.empCount).toFixed(2)) : 0;
        return {
          date,
          totalWorkspaceHours: avgHours,
          tasksCompleted: avgTasks,
          employeeCount: item.empCount,
        };
      })
      .sort((a, b) => a.totalWorkspaceHours - b.totalWorkspaceHours);

    res.json({
      fromDate,
      toDate,
      totalRecords: records.length,
      daysEvaluated: chartData.length,
      chartData,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch daily performance analytics", message: err.message });
  }
});

import ProductPerformance from "../models/product-performance.model";

router.get("/analytics/product-daily-performance", async (req, res) => {
  try {
    const fromDate = (req.query.fromDate as string) || "2024-01-01";
    const toDate = (req.query.toDate as string) || "2024-01-31";

    let records: any[] = [];

    try {
      const dbDocs = await ProductPerformance.find({
        $or: [
          { date: { $gte: fromDate, $lte: toDate } },
          { soldDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } }
        ]
      }).sort({ soldDate: 1, date: 1 });

      if (dbDocs && dbDocs.length > 0) {
        for (const doc of dbDocs) {
          if (Array.isArray(doc.data)) {
            records.push(...doc.data);
          } else if (doc.profit !== undefined || doc.sellingTimePeriod !== undefined) {
            records.push(doc);
          }
        }
      }
    } catch (e) {
      console.warn("MongoDB query failed for ProductPerformance, checking fallbacks:", e);
    }

    if (records.length === 0) {
      const jsonPath = path.resolve(__dirname, "..", "data", "productperformance.json");
      if (fs.existsSync(jsonPath)) {
        try {
          const raw = fs.readFileSync(jsonPath, "utf-8");
          if (raw.trim().length > 0) {
            const all = JSON.parse(raw);
            records = all.filter((r: any) => {
              const d = r.date || r.Solddate || r.soldDate;
              return !d || (d >= fromDate && d <= toDate);
            });
          }
        } catch (jErr) {
          console.warn("Error reading productperformance.json:", jErr);
        }
      }
    }

    if (records.length === 0) {
      const products = await Product.find({});
      for (const p of products) {
        const price = Number(p.price || p.mrp || 100);
        const cost = Number(p.cost || price * 0.4);
        const profitVal = Math.max(10, price - cost);
        const timeVal = Math.max(1, Math.round(30 - Math.min(25, (p.soldUnits || 0) / 10)));
        records.push({
          productId: p._id,
          productName: p.name,
          category: p.category,
          profit: profitVal,
          sellingTimePeriod: timeVal,
          date: fromDate,
        });
      }
    }

    const dateMap = new Map<string, { totalProfit: number; totalTime: number; count: number }>();

    for (const r of records) {
      const dateKey = r.date || (r.soldDate ? new Date(r.soldDate).toISOString().split('T')[0] : "Overall");
      const profitVal = Number(r.profit ?? r.Profit ?? 0);
      const timeVal = Number(r.sellingTimePeriod ?? r.SellingTimePeriod ?? 0);

      const cur = dateMap.get(dateKey) || { totalProfit: 0, totalTime: 0, count: 0 };
      cur.totalProfit += profitVal;
      cur.totalTime += timeVal;
      cur.count += 1;
      dateMap.set(dateKey, cur);
    }

    const chartData = Array.from(dateMap.entries())
      .map(([date, item]) => {
        const avgProfit = item.count > 0 ? Number((item.totalProfit / item.count).toFixed(2)) : 0;
        const avgTime = item.count > 0 ? Number((item.totalTime / item.count).toFixed(2)) : 0;
        return {
          date,
          profit: avgProfit,
          sellingTimePeriod: avgTime,
          productCount: item.count,
        };
      })
      .sort((a, b) => a.profit - b.profit);

    res.json({
      fromDate,
      toDate,
      totalRecords: records.length,
      chartData,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch product performance analytics", message: err.message });
  }
});

export default router;
