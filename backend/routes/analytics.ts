import { Router } from "express";
import { db, employeesTable, tasksTable, performanceTable, productsTable, departmentsTable } from "@workspace/db";
import { eq, count, avg, sum, and } from "drizzle-orm";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  const [empStats] = await db.select({
    total: count(),
  }).from(employeesTable);

  const [activeEmpStats] = await db.select({ total: count() }).from(employeesTable).where(eq(employeesTable.status, "active"));
  const [taskStats] = await db.select({ total: count() }).from(tasksTable);
  const [completedTasks] = await db.select({ total: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
  const [pendingTasks] = await db.select({ total: count() }).from(tasksTable).where(eq(tasksTable.status, "pending"));
  const [prodStats] = await db.select({ total: count() }).from(productsTable);
  const [highDemand] = await db.select({ total: count() }).from(productsTable).where(eq(productsTable.marketStatus, "high_demand"));
  const [lowDemand] = await db.select({ total: count() }).from(productsTable).where(eq(productsTable.marketStatus, "low_demand"));
  const [avgPerf] = await db.select({ avg: avg(performanceTable.score) }).from(performanceTable);
  const [revenueStats] = await db.select({ total: sum(productsTable.revenue) }).from(productsTable);

  res.json({
    totalEmployees: Number(empStats.total),
    activeEmployees: Number(activeEmpStats.total),
    totalTasks: Number(taskStats.total),
    completedTasks: Number(completedTasks.total),
    pendingTasks: Number(pendingTasks.total),
    totalProducts: Number(prodStats.total),
    highDemandProducts: Number(highDemand.total),
    lowDemandProducts: Number(lowDemand.total),
    avgPerformanceScore: Number(avgPerf.avg ?? 0),
    totalRevenue: Number(revenueStats.total ?? 0),
  });
});

router.get("/analytics/employee-performance", async (req, res) => {
  const departments = await db.select().from(departmentsTable);
  const result = await Promise.all(departments.map(async (dept) => {
    const employees = await db.select().from(employeesTable).where(eq(employeesTable.departmentId, dept.id));
    const empIds = employees.map(e => e.id);

    const [completedCount] = await db.select({ total: count() }).from(tasksTable)
      .where(and(eq(tasksTable.status, "completed")));
    const [pendingCount] = await db.select({ total: count() }).from(tasksTable)
      .where(and(eq(tasksTable.status, "pending")));

    const perfRecords = await db.select({ score: avg(performanceTable.score), eff: avg(performanceTable.efficiency) })
      .from(performanceTable);

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      avgScore: Number(perfRecords[0]?.score ?? 75),
      totalEmployees: employees.length,
      completedTasks: Number(completedCount.total),
      pendingTasks: Number(pendingCount.total),
      efficiency: Number(perfRecords[0]?.eff ?? 80),
    };
  }));
  res.json(result);
});

router.get("/analytics/product-ranking", async (req, res) => {
  const products = await db.select().from(productsTable).orderBy(productsTable.revenue);
  const sorted = [...products].sort((a, b) => {
    const scoreA = Number(a.revenue) * 0.6 + Number(a.price) * 0.4;
    const scoreB = Number(b.revenue) * 0.6 + Number(b.price) * 0.4;
    return scoreB - scoreA;
  });

  const result = sorted.map((p, i) => {
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
      productId: p.id,
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
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [prod] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }

  const price = Number(prod.price);
  const cost = Number(prod.cost);
  const revenue = Number(prod.revenue);
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
    productId: prod.id,
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
  const [total] = await db.select({ c: count() }).from(tasksTable);
  const [completed] = await db.select({ c: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
  const [inProgress] = await db.select({ c: count() }).from(tasksTable).where(eq(tasksTable.status, "in_progress"));
  const [pending] = await db.select({ c: count() }).from(tasksTable).where(eq(tasksTable.status, "pending"));
  const [failed] = await db.select({ c: count() }).from(tasksTable).where(eq(tasksTable.status, "failed"));

  const departments = await db.select().from(departmentsTable);
  const byDepartment = await Promise.all(departments.map(async (dept) => {
    const employees = await db.select({ id: employeesTable.id }).from(employeesTable)
      .where(eq(employeesTable.departmentId, dept.id));
    const empIds = employees.map(e => e.id);

    let deptCompleted = 0;
    let deptTotal = 0;
    for (const empId of empIds) {
      const [c] = await db.select({ c: count() }).from(tasksTable).where(and(eq(tasksTable.employeeId, empId), eq(tasksTable.status, "completed")));
      const [t] = await db.select({ c: count() }).from(tasksTable).where(eq(tasksTable.employeeId, empId));
      deptCompleted += Number(c.c);
      deptTotal += Number(t.c);
    }

    return {
      departmentName: dept.name,
      completed: deptCompleted,
      total: deptTotal,
    };
  }));

  const t = Number(total.c);
  const c = Number(completed.c);
  res.json({
    total: t,
    completed: c,
    inProgress: Number(inProgress.c),
    pending: Number(pending.c),
    failed: Number(failed.c),
    completionRate: t > 0 ? Math.round((c / t) * 100 * 10) / 10 : 0,
    byDepartment,
  });
});

export default router;
