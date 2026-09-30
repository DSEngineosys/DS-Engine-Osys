import "./load-env.js";
import mongoose from "mongoose";
import ProductPerformance from "./models/product-performance.model.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not defined in environment variables.");
  process.exit(1);
}

try {
  await mongoose.connect(databaseUrl);
  console.log("Connected to MongoDB...");

  const result = await ProductPerformance.deleteMany({});
  console.log(`✅ Successfully deleted ${result.deletedCount} product performance records.`);
} catch (err) {
  console.error("Error clearing product performance:", err);
  process.exit(1);
} finally {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}
