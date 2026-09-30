import "./load-env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ProductPerformance from "./models/product-performance.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedProductPerformance() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB for Product Performance Seeding...");

    const jsonPath = path.resolve(__dirname, "data", "productperformance.json");
    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const dataset = JSON.parse(rawData);

    // Delete existing product transaction records
    await ProductPerformance.deleteMany({ productId: { $exists: true, $ne: null } });
    console.log("Cleared existing ProductPerformance transaction records.");

    const docsToInsert = dataset.map((item: any) => ({
      productId: item.ProductId,
      productName: item.ProductName,
      category: item.Category,
      soldDate: new Date(item.Solddate),
      date: item.Solddate,
      sellingTimePeriod: Number(item.SellingTimePeriod ?? 0),
      profit: Number(item.Profit ?? 0),
      offersApplied: item.OffersApplied || "No Offer",
    }));

    await ProductPerformance.insertMany(docsToInsert);
    console.log(`✅ Successfully seeded ${docsToInsert.length} product performance records into MongoDB!`);
  } catch (err) {
    console.error("Error seeding product performance:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedProductPerformance().then(() => process.exit(0));
}
