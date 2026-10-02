import fs from "fs";
import path from "path";
import { connectToDatabase } from "../lib/db";
import Product from "../models/product.model";
import dotenv from "dotenv";

dotenv.config();

async function updateImages() {
  await connectToDatabase();
  
  const imagesDir = path.join(process.cwd(), "src", "data", "ProductImages");
  const files = fs.readdirSync(imagesDir);
  
  let updated = 0;
  for (const file of files) {
    const ext = path.extname(file);
    const productId = path.basename(file, ext);
    
    // Find the product and update its imageUrl
    const result = await Product.updateOne(
      { productId },
      { $set: { imageUrl: `/api/images/${file}` } }
    );
    
    if (result.modifiedCount > 0) {
      updated++;
    }
  }
  
  console.log(`Updated ${updated} products with image URLs.`);
  process.exit(0);
}

updateImages().catch(err => {
  console.error(err);
  process.exit(1);
});
