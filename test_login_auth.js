const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ds-engineosys");
  console.log("Connected");
  
  const Employee = require("./backend/src/models/employee.model").default;
  const DSEngineer = require("./backend/src/models/ds-engineer.model").default;
  const HR = require("./backend/src/models/hr.model").default;
  const Admin = require("./backend/src/models/admin.model").default;

  const email = "hr@admin.com";
  const password = "GENHR@100";

  let user = await Employee.findOne({ $or: [{ email }, { employeeId: email }] });
  console.log("Employee:", !!user);
  
  if (!user) {
    user = await DSEngineer.findOne({ email });
    console.log("DSEngineer:", !!user);
    if (!user) {
      user = await HR.findOne({ $or: [{ email }, { hrId: email }] });
      console.log("HR:", !!user);
    }
    if (!user) {
      user = await Admin.findOne({ email });
      console.log("Admin:", !!user);
    }
  }

  if (user) {
    console.log("Found user:", user.email, "role:", user.role);
    console.log("User password:", user.password);
    console.log("Matches:", user.password === password);
  } else {
    console.log("No user found");
  }

  process.exit(0);
}
run().catch(console.error);
