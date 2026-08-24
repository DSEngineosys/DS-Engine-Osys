import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import Admin from "./models/admin.model";
import HR from "./models/hr.model";
import DSEngineer from "./models/ds-engineer.model";
import Department from "./models/department.model";
import SubDepartment from "./models/sub-department.model";
import Employee from "./models/employee.model";
import Product from "./models/product.model";
import Task from "./models/task.model";
import Performance from "./models/performance.model";
import Setting from "./models/setting.model";
import DSTask from "./models/dstask.model";

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
      Admin.deleteMany({}),
      HR.deleteMany({}),
      DSEngineer.deleteMany({}),
      Department.deleteMany({}),
      SubDepartment.deleteMany({}),
      Employee.deleteMany({}),
      Product.deleteMany({}),
      Task.deleteMany({}),
      Performance.deleteMany({}),
      Setting.deleteMany({}),
      DSTask.deleteMany({}),
    ]);
    console.log("Cleared existing data.");

    // 0. Create Settings
    await Setting.create([
      { key: "companyName", value: "Cosmetic's A1" },
      { key: "mainProductCategory", value: "Premium Cosmetics" }
    ]);

    // 1. Create Admin
    await Admin.create({
      name: "Admin User",
      email: "admin@admin.com",
      password: "admin",
      role: "admin",
      status: "approved",
    });

    // 2. Create Departments
    const prodDept = await Department.create({ name: "Production Department", description: "Manufacturing" });
    const marketDept = await Department.create({ name: "Marketing Department", description: "Sales" });
    const itDept = await Department.create({ name: "IT Department", description: "Information Technology" });

    // 3. Create Sub-Departments
    const sdLabour = await SubDepartment.create({ name: "Labour Team", departmentId: prodDept._id });
    const sdPackaging = await SubDepartment.create({ name: "Packaging Team", departmentId: prodDept._id });
    const sdMachine = await SubDepartment.create({ name: "Machine Operator", departmentId: prodDept._id });
    
    const sdISR = await SubDepartment.create({ name: "ISR", departmentId: marketDept._id });
    const sdTSO = await SubDepartment.create({ name: "TSO", departmentId: marketDept._id });
    const sdSO = await SubDepartment.create({ name: "SO", departmentId: marketDept._id });
    const sdSSO = await SubDepartment.create({ name: "SSO", departmentId: marketDept._id });

    // 4. Create HR in HR Collection
    await HR.create({
      name: "HR Manager",
      email: "hr@admin.com",
      password: "GENHR@100",
      role: "hr",
      status: "approved",
      departmentId: itDept._id,
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

    // 9. Create Predefined DS Tasks
    await DSTask.insertMany([
      { title: "Loading Materials", description: "Receive raw materials and move them from vehicles or storage to the production area safely.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Unloading Materials", description: "Unload raw materials, components, packaging materials or finished goods without causing damage.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Material Handling", description: "Move raw materials and semi-finished products between production stages as required.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Assist Machine Operators", description: "Supply materials to machine operators, collect processed products and provide operational support.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Raw Material Handling", description: "Arrange, identify and supply required raw materials according to production requirements.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Production Support", description: "Assist production workers and operators to maintain a continuous workflow.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Product Movement", description: "Transfer finished or semi-finished products to inspection, packaging, storage or dispatch areas.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Workplace Cleanliness", description: "Keep production and material-handling areas clean, organized and free from unnecessary obstructions.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Safety Procedures", description: "Follow PPE and safety instructions and immediately report unsafe conditions.", departmentName: "Production Department", subDepartmentName: "Labour Team" },
      { title: "Waste Handling", description: "Separate and move production waste, rejected material and scrap to designated areas.", departmentName: "Production Department", subDepartmentName: "Labour Team" },

      { title: "Receive Finished Products", description: "Collect completed products from production after required checking or quality clearance.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Product Checking", description: "Check quantity and identify visible damage, defects or incorrect items before packing.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Packing", description: "Place products into the correct boxes, bags, containers or other approved packaging.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Quantity Checking", description: "Ensure the correct number of products is packed in each package.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Labeling", description: "Apply correct product labels, batch numbers, dates, barcodes and other required information.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Sealing", description: "Seal boxes, bags, cartons or containers securely to prevent damage or loss.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Box Arrangement", description: "Arrange products properly inside boxes to reduce movement and damage during transportation.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Package Identification", description: "Mark packages with product name, quantity, batch number, destination or other required details.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Storage Preparation", description: "Arrange packed products for safe and efficient transfer to the warehouse.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Dispatch Preparation", description: "Organize packed goods according to customer orders or dispatch requirements.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },
      { title: "Packaging Material Management", description: "Monitor availability of boxes, labels, tape, bags and other.", departmentName: "Production Department", subDepartmentName: "Packaging Team" },

      { title: "Machine Operation", description: "Operate production machines according to approved operating procedures and production requirements.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Machine Setup", description: "Prepare machines before production, including fitting required tools, dies, components or materials.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Parameter Setting", description: "Set approved machine parameters such as speed, temperature, pressure and time according to product requirements.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Production Monitoring", description: "Monitor machine operation and output continuously to identify abnormalities.", departmentName: "Production Department", subDepartmentName: "Machine Operator", requiresQuantity: true },
      { title: "Quality Monitoring", description: "Check output for visible or process-related issues and report deviations promptly.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Machine Maintenance", description: "Perform routine cleaning, lubrication, inspection and other authorized preventive maintenance.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Problem Identification", description: "Identify unusual noise, vibration, overheating, incorrect output or other machine abnormalities.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Breakdown Reporting", description: "Report major breakdowns or technical issues promptly to the supervisor or maintenance team.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Machine Adjustment", description: "Make authorized adjustments to machine settings when required to maintain stable production.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Production Records", description: "Record production quantity, machine downtime, operating hours and machine-related issues.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Safety Compliance", description: "Follow machine safety procedures and use required PPE while operating equipment.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },
      { title: "Machine Shutdown", description: "Stop and isolate machines safely after production or during emergencies according to procedures.", departmentName: "Production Department", subDepartmentName: "Machine Operator" },

      { title: "CORE PRODUCT", description: "Consignment Task: Core Product distribution.", departmentName: "Marketing Department", subDepartmentName: "TSO" },
      { title: "NEW LAUNCH", description: "Consignment Task: New Launch promotion.", departmentName: "Marketing Department", subDepartmentName: "TSO" },
      { title: "BUFFER STOCK", description: "Consignment Task: Buffer Stock management.", departmentName: "Marketing Department", subDepartmentName: "TSO" },

      { title: "WEEKLY REPORT", description: "Meeting: Submit weekly sales and lead generation report.", departmentName: "Marketing Department", subDepartmentName: "ISR" },
      { title: "CAMPAIGN REVIEW", description: "Meeting: Review ongoing campaign performance.", departmentName: "Marketing Department", subDepartmentName: "ISR" },
      { title: "STRATEGY", description: "Meeting: Quarterly strategy alignment session.", departmentName: "Marketing Department", subDepartmentName: "ISR" },
      { title: "TRAINING MEETING", description: "Meeting: Product and sales training session.", departmentName: "Marketing Department", subDepartmentName: "ISR" }
    ]);

    console.log("Database seeded successfully with new separate DB structures!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
