import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  await mongoose.connect(process.env.DATABASE_URL!);
  const Setting = mongoose.model("Setting", new mongoose.Schema({ key: String, value: String }));
  const settings = await Setting.find({});
  console.log("Current Settings:", JSON.stringify(settings, null, 2));
  await mongoose.connection.close();
}

run().catch(console.error);
