import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import User from "./models/user.model";
import Department from "./models/department.model";
import Employee from "./models/employee.model";
import Product from "./models/product.model";
import Task from "./models/task.model";
import Performance from "./models/performance.model";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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
      Department.deleteMany({}),
      Employee.deleteMany({}),
      Product.deleteMany({}),
      Task.deleteMany({}),
      Performance.deleteMany({}),
    ]);
    console.log("Cleared existing data.");

    // 1. Create Admin & Engineers
    const admin = await User.create({
      name: "System Admin",
      email: "admin@admin.com",
      password: "admin",
      role: "admin",
      status: "approved",
    });

    const engineer = await User.create({
      name: "John Engineer",
      email: "john@ds.com",
      password: "password123",
      role: "ds_engineer",
      status: "approved",
    });

    console.log("Created users.");

    // 2. Create Departments
    const itDept = await Department.create({
      name: "Information Technology",
      description: "Handles all software and hardware infrastructure",
    });

    const hrDept = await Department.create({
      name: "Human Resources",
      description: "People operations and recruitment",
    });

    const salesDept = await Department.create({
      name: "Sales & Marketing",
      description: "Driving growth and customer acquisition",
    });

    console.log("Created departments.");

    // 3. Create Employees
    const emp1 = await Employee.create({
      name: "Alice Smith",
      email: "alice@company.com",
      employeeId: "EMP001",
      departmentId: itDept._id,
      designation: "Senior Developer",
      joiningDate: new Date("2023-01-15"),
      status: "active",
      performanceScore: 92,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    });

    const emp2 = await Employee.create({
      name: "Bob Johnson",
      email: "bob@company.com",
      employeeId: "EMP002",
      departmentId: salesDept._id,
      designation: "Sales Lead",
      joiningDate: new Date("2023-03-10"),
      status: "active",
      performanceScore: 85,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    });

    console.log("Created employees.");

    // 4. Create Products
    await Product.create([
      {
        name: "Enterprise Cloud Suite",
        category: "Software",
        sku: "ECS-001",
        price: 1200,
        cost: 400,
        stock: 50,
        soldUnits: 120,
        revenue: 144000,
        marketStatus: "high_demand",
      },
      {
        name: "AI Analytics Pro",
        category: "Software",
        sku: "AAP-002",
        price: 800,
        cost: 200,
        stock: 100,
        soldUnits: 45,
        revenue: 36000,
        marketStatus: "moderate",
      },
      {
        name: "Legacy Server Rack",
        category: "Hardware",
        sku: "LSR-003",
        price: 5000,
        cost: 4500,
        stock: 5,
        soldUnits: 2,
        revenue: 10000,
        marketStatus: "low_demand",
      }
    ]);

    console.log("Created products.");

    // 5. Create Tasks
    await Task.create([
      {
        title: "Migrate Server to AWS",
        description: "Move all legacy on-premise data to cloud",
        employeeId: emp1._id,
        status: "in_progress",
        priority: "high",
        dueDate: new Date("2026-06-01"),
      },
      {
        title: "Update Q3 Sales Strategy",
        description: "Draft new approach for international markets",
        employeeId: emp2._id,
        status: "pending",
        priority: "medium",
        dueDate: new Date("2026-05-20"),
      },
      {
        title: "Fix Login Bug",
        description: "Resolve intermittent 500 errors on auth route",
        employeeId: emp1._id,
        status: "completed",
        priority: "critical",
        completedAt: new Date(),
      }
    ]);

    console.log("Created tasks.");

    // 6. Create Performance Records
    await Performance.create([
      {
        employeeId: emp1._id,
        period: "Q1 2026",
        score: 95,
        tasksCompleted: 12,
        tasksFailed: 0,
        efficiency: 98,
        notes: "Excellent technical leadership",
      },
      {
        employeeId: emp2._id,
        period: "Q1 2026",
        score: 82,
        tasksCompleted: 8,
        tasksFailed: 1,
        efficiency: 85,
        notes: "Exceeded sales targets by 10%",
      }
    ]);

    console.log("Created performance records.");

    console.log("\nDatabase seeded successfully!");
    console.log("Collections created in Compass:");
    console.log("- users\n- departments\n- employees\n- products\n- tasks\n- performances");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
