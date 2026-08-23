const mongoose = require("mongoose");
require("dotenv").config();
const HR = require("./backend/src/models/hr.model").default;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ds-engineosys");
  console.log("Connected");
  const email = "hr@admin.com";
  const user = await HR.findOne({ $or: [{ email }, { hrId: email }] });
  console.log("HR user:", user);
  if (user) {
    console.log("Password matches?", user.password === "GENHR@100");
  }
  process.exit(0);
}
run().catch(console.error);
