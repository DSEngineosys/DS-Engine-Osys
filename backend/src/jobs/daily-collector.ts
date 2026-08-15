import Employee from "../models/employee.model";
import Product from "../models/product.model";
import DailyCollection from "../models/daily-collection.model";
import Department from "../models/department.model";

async function collectDailyData() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`[DailyCollector] Running collection for ${today}...`);

  try {
    // Collect Employee Performance Data
    const employees = await Employee.find();
    const employeeData = await Promise.all(
      employees.map(async (emp: any) => {
        const dept = await Department.findById(emp.departmentId);
        return {
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          departmentName: dept?.name ?? "Unknown",
          subDepartment: emp.subDepartment,
          designation: emp.designation,
          accountStatus: emp.accountStatus,
          performanceScore: emp.performanceScore,
          location: emp.location,
          employmentType: emp.employmentType,
          shift: emp.shift,
          monthlySalary: emp.monthlySalary,
          collectedAt: new Date().toISOString(),
        };
      })
    );

    await DailyCollection.findOneAndUpdate(
      { date: today, type: "employee" },
      { date: today, type: "employee", data: employeeData },
      { upsert: true, new: true }
    );
    console.log(`[DailyCollector] ✅ Employee data collected (${employeeData.length} records)`);

    // Collect Product Performance Data
    const products = await Product.find();
    const productData = products.map((p: any) => ({
      productId: p.productId || p._id,
      name: p.name,
      category: p.category,
      subCategory: p.subCategory,
      sku: p.sku,
      mrp: p.mrp,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      soldUnits: p.soldUnits,
      revenue: p.revenue,
      discountPercent: p.discountPercent,
      taxPercent: p.taxPercent,
      offerPercentage: p.offerPercentage,
      marketStatus: p.marketStatus,
      status: p.status,
      expiryDate: p.expiryDate,
      collectedAt: new Date().toISOString(),
    }));

    await DailyCollection.findOneAndUpdate(
      { date: today, type: "product" },
      { date: today, type: "product", data: productData },
      { upsert: true, new: true }
    );
    console.log(`[DailyCollector] ✅ Product data collected (${productData.length} records)`);
  } catch (err) {
    console.error("[DailyCollector] Error during daily collection:", err);
  }
}

export function startDailyCollector() {
  // Run immediately on start
  collectDailyData();

  // Calculate ms until next midnight
  function msUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  // Schedule first run at next midnight, then repeat every 24h
  setTimeout(() => {
    collectDailyData();
    setInterval(collectDailyData, 24 * 60 * 60 * 1000);
  }, msUntilMidnight());

  console.log(`[DailyCollector] Scheduled. Next run at midnight (in ${Math.round(msUntilMidnight() / 60000)} min)`);
}
