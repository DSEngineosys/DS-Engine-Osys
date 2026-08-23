const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ds-engineosys");
  console.log("Connected");
  const HR = require("./backend/src/models/hr.model").default;
  const hrs = await HR.find({});
  console.log("HRs:");
  for (const h of hrs) {
    console.log(`- ${h.email} | role: "${h.role}"`);
  }
  process.exit(0);
}
run().catch(console.error);
