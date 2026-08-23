import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import User from "./models/user.model";
import HR from "./models/hr.model";
import DSEngineer from "./models/ds-engineer.model";
import Department from "./models/department.model";
import SubDepartment from "./models/sub-department.model";
import Employee from "./models/employee.model";
import Product from "./models/product.model";
import Task from "./models/task.model";
import Performance from "./models/performance.model";
import Setting from "./models/setting.model";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not defined in .env file");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(DATABASE_URL!);
    console.log("Connected to MongoDB...");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      HR.deleteMany({}),
      DSEngineer.deleteMany({}),
      Department.deleteMany({}),
      SubDepartment.deleteMany({}),
      Employee.deleteMany({}),
      Product.deleteMany({}),
      Task.deleteMany({}),
      Performance.deleteMany({}),
      Setting.deleteMany({}),
    ]);
    console.log("Cleared existing data.");

    // 0. Create Settings
    await Setting.create([
      { key: "companyName", value: "Cosmetic's A1" },
      { key: "mainProductCategory", value: "Premium Cosmetics" }
    ]);

    // 1. Create Admin
    await User.create({
      name: "Admin User",
      email: "admin@admin.com",
      password: "admin",
      role: "admin",
      status: "approved",
    });

    // 2. Create Departments
    const prodDept = await Department.create({ name: "Production Department", description: "Manufacturing" });
    const marketDept = await Department.create({ name: "Marketing Department", description: "Sales" });
    const hrDept = await Department.create({ name: "HR Department", description: "Talent acquisition" });

    // 3. Create Sub-Departments
    const sdLabour = await SubDepartment.create({ name: "Labour Team", departmentId: prodDept._id });
    const sdPackaging = await SubDepartment.create({ name: "Packaging Team", departmentId: prodDept._id });
    const sdMachine = await SubDepartment.create({ name: "Machine Operator", departmentId: prodDept._id });
    
    const sdISR = await SubDepartment.create({ name: "ISR", departmentId: marketDept._id });
    const sdTSO = await SubDepartment.create({ name: "TSO", departmentId: marketDept._id });
    const sdSO = await SubDepartment.create({ name: "SO", departmentId: marketDept._id });

    // 4. Create HR in HR Collection
    await HR.create({
      name: "HR Manager",
      email: "hr@admin.com",
      password: "GENHR@100",
      role: "hr",
      status: "approved",
      departmentId: hrDept._id,
    });

    // 5. Create DS Engineers in DSEngineer Collection
    const engDocs = await DSEngineer.create([
      { name: "Zaid Khan", email: "zaid.khan@ds-osys.com", password: "password123", role: "ds_engineer", status: "approved", departmentId: prodDept._id, performanceScore: 95 },
      { name: "Sarah Miller", email: "sarah.miller@ds-osys.com", password: "password123", role: "ds_engineer", status: "approved", departmentId: prodDept._id, performanceScore: 92 },
      { name: "Alex Chen", email: "alex.chen@ds-osys.com", password: "password123", role: "ds_engineer", status: "approved", departmentId: prodDept._id, performanceScore: 88 },
    ]);

    // 6. Create Employees
    const marketingEmp = await Employee.create({
      name: "Jessica Alba",
      email: "jessica@ds-osys.com",
      employeeId: "EMPMI0001",
      departmentId: marketDept._id,
      subDepartmentId: sdISR._id,
      designation: "Marketing Specialist",
      joiningDate: new Date(),
      status: "active",
      performanceScore: 88,
    });

    // 7. Create Products
    await Product.create([
      { name: "A1 Matte Lip Gloss", category: "Cosmetics", sku: "LG-A1-001", price: 25, cost: 5, stock: 500, soldUnits: 1200, revenue: 30000, offerPercentage: 20, marketStatus: "high_demand" },
    ]);

    // 8. Create Tasks
    await Task.create([
      { title: "Product Launch: A1 Blush", description: "Coordinate with production", employeeId: marketingEmp._id, status: "in_progress", priority: "high", dueDate: new Date("2026-06-01") },
    ]);

    console.log("Database seeded successfully with new separate DB structures!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
