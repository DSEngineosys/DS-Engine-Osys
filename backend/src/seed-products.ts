import "./load-env.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Product from "./models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDateString(str?: string): Date | undefined {
  if (!str) return undefined;
  const parts = str.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(str);
}

export async function seedProducts() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    console.log("Connected to MongoDB for Product Seeding...");

    const jsonPath = path.resolve(__dirname, "data", "products.json");
    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const dataset = JSON.parse(rawData);

    // Upsert or clear products
    await Product.deleteMany({});
    console.log("Cleared existing Product collection.");

    let insertedCount = 0;

    for (const item of dataset) {
      const stock = Number(item.stockQuantity ?? item.stock ?? 0);
      const discount = Number(item.discountPercent ?? 0);
      const sellingPrice = Number(item.sellingPrice ?? item.price ?? 0);
      const mrp = Number(item.mrp ?? sellingPrice);
      const tax = Number(item.taxPercent ?? 18);

      // Derive market status
      let marketStatus = "moderate";
      if (stock < 200) {
        marketStatus = "critical";
      } else if (discount >= 20) {
        marketStatus = "high_demand";
      } else if (discount === 0 || discount <= 5) {
        marketStatus = "low_demand";
      } else {
        marketStatus = "moderate";
      }

      // Generate realistic sold units based on stock & demand
      const baseSold = Math.floor((stock * 0.35) + (discount * 12));
      const soldUnits = Math.max(25, baseSold);
      const revenue = Math.round(soldUnits * sellingPrice * 100) / 100;

      const productDoc = {
        productId: item.productId,
        sku: item.productId,
        name: item.productName || item.name,
        category: item.category,
        subCategory: item.subCategory,
        type: item.type,
        gender: item.gender,
        ageGroup: item.ageGroup,
        batchNumber: item.batchNumber,
        manufactureDate: parseDateString(item.manufactureDate),
        expiryDate: parseDateString(item.expiryDate),
        mrp: mrp,
        cost: Math.round(sellingPrice * 0.6 * 100) / 100,
        discountPercent: discount,
        taxPercent: tax,
        price: sellingPrice,
        stock: stock,
        soldUnits: soldUnits,
        revenue: revenue,
        offerPercentage: discount > 0 ? discount : undefined,
        marketStatus: marketStatus,
        status: "active",
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        description: item.productDescription || item.description || "",
        imageUrl: item.image || item.imageUrl || "",
      };

      await Product.create(productDoc);
      insertedCount++;
    }

    console.log(`✅ Successfully seeded ${insertedCount} products into MongoDB!`);
  } catch (err) {
    console.error("Error seeding products:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedProducts().then(() => process.exit(0));
}
