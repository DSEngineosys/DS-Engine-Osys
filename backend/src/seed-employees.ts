import "./load-env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Employee from "./models/employee.model.js";
import Department from "./models/department.model.js";
import SubDepartment from "./models/sub-department.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedEmployees() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB...");

    // 1. Ensure departments exist
    let prodDept = await Department.findOne({ name: { $regex: /production/i } });
    if (!prodDept) {
      prodDept = await Department.create({
        name: "Production Department",
        description: "Manufacturing & Operations",
      });
      console.log("Created Production Department");
    }

    let marketDept = await Department.findOne({ name: { $regex: /marketing/i } });
    if (!marketDept) {
      marketDept = await Department.create({
        name: "Marketing Department",
        description: "Sales & Marketing",
      });
      console.log("Created Marketing Department");
    }

    // 2. Map sub-departments
    const getOrCreateSubDept = async (subDeptName: string, deptId: mongoose.Types.ObjectId) => {
      const trimmed = subDeptName.trim();
      let subDept = await SubDepartment.findOne({
        departmentId: deptId,
        name: { $regex: new RegExp(`^${trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i") },
      });
      if (!subDept) {
        subDept = await SubDepartment.create({
          name: trimmed,
          departmentId: deptId,
        });
        console.log(`Created Sub-Department: ${trimmed}`);
      }
      return subDept;
    };

    // Read employees JSON
    const jsonPath = path.resolve(__dirname, "data", "employees.json");
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const dataset = JSON.parse(rawData);

    // Clear existing employee data
    await Employee.deleteMany({});
    console.log("Cleared existing Employee collection.");

    let insertedCount = 0;

    for (const item of dataset) {
      const deptNameStr = (item.department || "").trim().toLowerCase();
      const targetDept = deptNameStr.includes("prod") ? prodDept : marketDept;

      const subDeptStr = (item.subDepartment || "").trim();
      const subDeptDoc = subDeptStr ? await getOrCreateSubDept(subDeptStr, targetDept._id as mongoose.Types.ObjectId) : null;

      const empData = {
        name: item.EmployeeName.trim(),
        email: item.Email.trim().toLowerCase(),
        employeeId: item.EmployeeId.trim(),
        departmentId: targetDept._id,
        subDepartmentId: subDeptDoc ? subDeptDoc._id : undefined,
        designation: item.designation ? item.designation.trim() : (item.jobTitle ? item.jobTitle.trim() : "Employee"),
        jobTitle: item.jobTitle ? item.jobTitle.trim() : undefined,
        joiningDate: new Date(item.joiningDate),
        status: "active",
        accountStatus: "Approved",
        contactNumber: String(item.contactNumber).trim(),
        gender: item.gender ? item.gender.trim() : undefined,
        location: item.location ? item.location.trim() : undefined,
        employmentType: item.employmentType ? item.employmentType.trim() : "Fulltime",
        shift: item.shift ? item.shift.trim() : undefined,
        monthlySalary: item.monthlySalary ? Number(item.monthlySalary) : undefined,
        password: item.password ? item.password.trim() : "",
        performanceScore: 0,
      };

      await Employee.create(empData);
      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} employees into MongoDB!`);
  } catch (err) {
    console.error("Error seeding employees:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

seedEmployees();
