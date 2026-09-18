import "./load-env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Employee from "./models/employee.model.js";
import Department from "./models/department.model.js";
import SubDepartment from "./models/sub-department.model.js";
import EmployeeDailyPerformance from "./models/employee-daily-performance.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDailyPerformance() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB...");

    // 1. Fetch Employees, Departments, SubDepartments
    const employees = await Employee.find();
    console.log(`Found ${employees.length} employees in DB.`);

    const departments = await Department.find();
    const subDepartments = await SubDepartment.find();

    const deptMap = new Map<string, any>();
    for (const d of departments) {
      deptMap.set(String(d._id), d);
    }

    const subDeptMap = new Map<string, any>();
    for (const sd of subDepartments) {
      subDeptMap.set(String(sd._id), sd);
    }

    const empMap = new Map<string, any>();
    for (const emp of employees) {
      empMap.set(emp.employeeId, emp);
    }

    // 2. Read dataset
    const jsonPath = path.resolve(__dirname, "data", "employeedailyperformances.json");
    console.log(`Loading dataset from ${jsonPath}...`);
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const records = JSON.parse(rawData);
    console.log(`Total daily records to process: ${records.length}`);

    // 3. Group by date & enrich
    const groupedByDate = new Map<string, any[]>();
    const employeeScoresAccumulator = new Map<string, { totalScore: number; count: number }>();

    for (const r of records) {
      const dateStr = r.date;
      if (!dateStr) continue;

      const emp = empMap.get(r.employeeId);
      const dept = emp && emp.departmentId ? deptMap.get(String(emp.departmentId)) : null;
      const subDept = emp && emp.subDepartmentId ? subDeptMap.get(String(emp.subDepartmentId)) : null;

      // Calculate a composite performance score for present days
      const isPresent = r.attendanceStatus === "Present";
      const prodScore = typeof r.productivityScore === "number" ? r.productivityScore : 0;
      const qualScore = typeof r.qualityScore === "number" ? r.qualityScore : 0;
      const compRate = typeof r.taskCompletionRate === "number" ? r.taskCompletionRate : 0;

      const performanceScore = isPresent
        ? Number(((prodScore * 0.5) + (qualScore * 0.3) + (compRate * 0.2)).toFixed(2))
        : 0;

      if (isPresent && performanceScore > 0 && emp) {
        const current = employeeScoresAccumulator.get(emp.employeeId) || { totalScore: 0, count: 0 };
        current.totalScore += performanceScore;
        current.count += 1;
        employeeScoresAccumulator.set(emp.employeeId, current);
      }

      const enrichedSnapshot = {
        recordId: r.recordId,
        employeeId: r.employeeId,
        _id: emp ? emp._id : undefined,
        name: emp ? emp.name : r.employeeName || r.EmployeeName,
        email: emp ? emp.email : undefined,
        departmentId: emp ? emp.departmentId : undefined,
        departmentName: dept ? dept.name : r.department,
        subDepartmentId: emp ? emp.subDepartmentId : undefined,
        subDepartment: subDept ? subDept.name : r.subDepartment,
        designation: emp ? emp.designation : r.designation || r.jobTitle,
        jobTitle: emp ? emp.jobTitle : r.jobTitle,
        date: r.date,
        dayOfWeek: r.dayOfWeek,
        taskMode: r.taskMode,
        assignedWork: r.assignedWork,
        attendanceStatus: r.attendanceStatus,
        loginTime: r.loginTime,
        logoutTime: r.logoutTime,
        totalWorkspaceHours: Number(r.totalWorkspaceHours || 0),
        activeWorkHours: Number(r.activeWorkHours || 0),
        idleHours: Number(r.idleHours || 0),
        overtimeHours: Number(r.overtimeHours || 0),
        tasksAssigned: Number(r.tasksAssigned || 0),
        tasksCompleted: Number(r.tasksCompleted || 0),
        taskCompletionRate: Number(r.taskCompletionRate || 0),
        productivityScore: prodScore,
        qualityScore: qualScore,
        performanceScore: performanceScore,
        pointsEarned: Number(r.pointsEarned || 0),
        targetAchievementPercent: Number(r.targetAchievementPercent || 0),
        customerInteractions: Number(r.customerInteractions || 0),
        errorsReported: Number(r.errorsReported || 0),
        salesValueINR: Number(r.salesValueINR || 0),
        estimatedProfitContributionINR: Number(r.estimatedProfitContributionINR || 0),
        location: emp ? emp.location : r.location,
        shift: emp ? emp.shift : r.shift,
        monthlySalary: emp ? emp.monthlySalary : r.monthlySalary,
        employmentType: emp ? emp.employmentType : r.employmentType,
        collectedAt: new Date(r.date).toISOString(),
      };

      if (!groupedByDate.has(dateStr)) {
        groupedByDate.set(dateStr, []);
      }
      groupedByDate.get(dateStr)!.push(enrichedSnapshot);
    }

    console.log(`Unique dates grouped: ${groupedByDate.size}`);

    // 4. Clear existing EmployeeDailyPerformance collection
    await EmployeeDailyPerformance.deleteMany({});
    console.log("Cleared existing EmployeeDailyPerformance collection.");

    // 5. Bulk insert daily performance documents in batches
    const dailyDocs = [];
    for (const [date, data] of groupedByDate.entries()) {
      dailyDocs.push({
        date,
        data,
      });
    }

    const batchSize = 100;
    for (let i = 0; i < dailyDocs.length; i += batchSize) {
      const batch = dailyDocs.slice(i, i + batchSize);
      await EmployeeDailyPerformance.insertMany(batch);
      console.log(`Inserted ${Math.min(i + batchSize, dailyDocs.length)} / ${dailyDocs.length} dates...`);
    }

    // 6. Update each Employee's overall performanceScore in DB
    console.log("Updating overall performance scores on Employee documents...");
    for (const emp of employees) {
      const stats = employeeScoresAccumulator.get(emp.employeeId);
      if (stats && stats.count > 0) {
        const avgScore = Number((stats.totalScore / stats.count).toFixed(1));
        await Employee.findByIdAndUpdate(emp._id, { performanceScore: avgScore });
        console.log(`Updated ${emp.employeeId} (${emp.name}): avg performance score = ${avgScore}`);
      }
    }

    console.log("✅ Successfully transformed and seeded 4 years of daily employee performance data!");
  } catch (err) {
    console.error("Error seeding daily performance:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

seedDailyPerformance();
