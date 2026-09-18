import "./load-env.js";
import mongoose from "mongoose";
import Employee from "./models/employee.model.js";
import EmployeeDailyPerformance from "./models/employee-daily-performance.model.js";
import EmployeeActivity from "./models/employee-activity.model.js";
import Performance from "./models/performance.model.js";

async function clearEmployeeData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB...");

    const empResult = await Employee.deleteMany({});
    console.log(`Cleared Employee collection: ${empResult.deletedCount} documents deleted.`);

    const dailyPerfResult = await EmployeeDailyPerformance.deleteMany({});
    console.log(`Cleared EmployeeDailyPerformance collection: ${dailyPerfResult.deletedCount} documents deleted.`);

    const actResult = await EmployeeActivity.deleteMany({});
    console.log(`Cleared EmployeeActivity collection: ${actResult.deletedCount} documents deleted.`);

    const perfResult = await Performance.deleteMany({});
    console.log(`Cleared Performance collection: ${perfResult.deletedCount} documents deleted.`);

    console.log("Successfully cleared all employee and performance data!");
  } catch (err) {
    console.error("Error clearing employee data:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

clearEmployeeData();
