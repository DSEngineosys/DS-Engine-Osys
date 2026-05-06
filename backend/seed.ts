import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import User from "./models/user.model";
import Department from "./models/department.model";
import Employee from "./models/employee.model";
import Product from "./models/product.model";
import Task from "./models/task.model";
import Performance from "./models/performance.model";
import Setting from "./models/setting.model";

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
      Setting.deleteMany({}),
    ]);
    console.log("Cleared existing data.");

    // 0. Create Settings
    await Setting.create([
      { key: "companyName", value: "Cosmetic's A1" },
      { key: "mainProductCategory", value: "Premium Cosmetics" }
    ]);
    console.log("Created settings.");

    // 1. Create Admin & Engineers
    await User.create({
      name: "Admin User",
      email: "admin@admin.com",
      password: "admin",
      role: "admin",
      status: "approved",
    });

    console.log("Created users.");

    // 2. Create Departments (Matching the new UI flow)
    const prodDept = await Department.create({
      name: "Production Department",
      description: "Manufacturing and quality control of A1 products",
    });

    const marketDept = await Department.create({
      name: "Marketing Department",
      description: "Sales, advertising and brand management",
    });

    const hrDept = await Department.create({
      name: "HR Department",
      description: "Talent acquisition and employee wellness",
    });

    console.log("Created departments.");

    // 3. Create Employees (including DS Engineers for carousel)
    const engineers = [
      { name: "Zaid Khan", designation: "Lead DS Engineer" },
      { name: "Sarah Miller", designation: "Senior DS Engineer" },
      { name: "Alex Chen", designation: "Junior DS Engineer" },
    ];

    const engineerDocs = [];
    for (const eng of engineers) {
       const doc = await Employee.create({
        name: eng.name,
        email: `${eng.name.toLowerCase().replace(' ', '.')}@ds-osys.com`,
        employeeId: `ENG${Math.floor(Math.random() * 1000)}`,
        departmentId: prodDept._id,
        designation: eng.designation,
        joiningDate: new Date(),
        status: "active",
        performanceScore: 90 + Math.floor(Math.random() * 10),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${eng.name}`,
      });
      engineerDocs.push(doc);
    }

    const marketingEmp = await Employee.create({
      name: "Jessica Alba",
      email: "jessica@ds-osys.com",
      employeeId: "MKT001",
      departmentId: marketDept._id,
      designation: "Marketing Specialist",
      joiningDate: new Date(),
      status: "active",
      performanceScore: 88,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    });

    console.log("Created employees.");

    // 4. Create Products (A1 themed with offers)
    await Product.create([
      {
        name: "A1 Matte Lip Gloss",
        category: "Cosmetics",
        sku: "LG-A1-001",
        price: 25,
        cost: 5,
        stock: 500,
        soldUnits: 1200,
        revenue: 30000,
        offerPercentage: 20,
        marketStatus: "high_demand",
      },
      {
        name: "A1 Liquid Foundation",
        category: "Cosmetics",
        sku: "FD-A1-002",
        price: 45,
        cost: 12,
        stock: 200,
        soldUnits: 850,
        revenue: 38250,
        offerPercentage: 15,
        marketStatus: "high_demand",
      },
      {
        name: "A1 Night Serum",
        category: "Skincare",
        sku: "SR-A1-003",
        price: 85,
        cost: 20,
        stock: 100,
        soldUnits: 300,
        revenue: 25500,
        offerPercentage: 10,
        marketStatus: "moderate",
      },
      {
        name: "A1 Eyeliner Pro",
        category: "Cosmetics",
        sku: "EL-A1-004",
        price: 18,
        cost: 4,
        stock: 600,
        soldUnits: 2000,
        revenue: 36000,
        offerPercentage: 0,
        marketStatus: "high_demand",
      }
    ]);

    console.log("Created products.");

    // 5. Create some Tasks for performance charts
    await Task.create([
      {
        title: "Product Launch: A1 Blush",
        description: "Coordinate with production for new line",
        employeeId: marketingEmp._id,
        status: "in_progress",
        priority: "high",
        dueDate: new Date("2026-06-01"),
      },
      {
        title: "Optimize Batch #402",
        description: "Increase production efficiency by 5%",
        employeeId: engineerDocs[0]._id,
        status: "completed",
        priority: "medium",
        completedAt: new Date(),
      }
    ]);

    console.log("Created tasks.");

    // 6. Performance Records
    await Performance.create([
      {
        employeeId: engineerDocs[0]._id,
        period: "April 2026",
        score: 96,
        tasksCompleted: 5,
        tasksFailed: 0,
        efficiency: 98,
      },
      {
        employeeId: marketingEmp._id,
        period: "April 2026",
        score: 85,
        tasksCompleted: 3,
        tasksFailed: 0,
        efficiency: 90,
      }
    ]);

    console.log("\nDatabase seeded successfully with 'Cosmetic's A1' theme!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
