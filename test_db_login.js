const mongoose = require("mongoose");
const path = require("path");

// Hardcode the schemas here to bypass imports and TS issues
const employeeSchema = new mongoose.Schema({ email: String, employeeId: String, password: { type: String, default: "" }, accountStatus: String, status: String });
const dsEngineerSchema = new mongoose.Schema({ email: String, password: { type: String, default: "" }, status: String, role: String });
const hrSchema = new mongoose.Schema({ email: String, hrId: String, password: { type: String, default: "" }, status: String, role: String });
const adminSchema = new mongoose.Schema({ email: String, password: { type: String, default: "" }, status: String, role: String });

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/ds-engine-osys");
  console.log("Connected");

  const Employee = mongoose.model("Employee", employeeSchema, "employees");
  const DSEngineer = mongoose.model("DSEngineer", dsEngineerSchema, "dsengineers");
  const HR = mongoose.model("HR", hrSchema, "hrs");
  const Admin = mongoose.model("Admin", adminSchema, "admins");

  const input = "zaidkhanadale@gmail.com";
  const password = "Zaid@123";

  let user = await Employee.findOne({ $or: [{ email: input.toLowerCase() }, { employeeId: input }] });
  if (!user) user = await DSEngineer.findOne({ email: input.toLowerCase() });
  if (!user) user = await HR.findOne({ $or: [{ email: input.toLowerCase() }, { hrId: input }] });
  if (!user) user = await Admin.findOne({ email: input.toLowerCase() });

  if (!user) {
    console.log("User not found!");
  } else {
    console.log("Found user:", user.email);
    console.log("DB Password:", user.password, "Input Password:", password);
    console.log("Matches?", user.password === password);
    console.log("Status:", user.status);
    console.log("Role:", user.role);
  }
  process.exit(0);
}
run().catch(console.error);
