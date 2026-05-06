import { Router } from "express";
import Product from "../models/product.model";
import mongoose from "mongoose";
import { z } from "zod";

const router = Router();

const createProdSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  price: z.number(),
  cost: z.number(),
  stock: z.number().int(),
  soldUnits: z.number().int(),
  marketStatus: z.enum(["high_demand", "moderate", "low_demand", "critical"]),
});

const updateProdSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().int().optional(),
  soldUnits: z.number().int().optional(),
  marketStatus: z.enum(["high_demand", "moderate", "low_demand", "critical"]).optional(),
});

const offerSchema = z.object({
  offerPercentage: z.number().min(1).max(90),
  reason: z.string().min(1),
});

function formatProduct(p: any) {
  return {
    id: p._id,
    name: p.name,
    category: p.category,
    sku: p.sku,
    price: Number(p.price),
    cost: Number(p.cost),
    stock: p.stock,
    soldUnits: p.soldUnits,
    revenue: Number(p.revenue),
    offerPercentage: p.offerPercentage ? Number(p.offerPercentage) : null,
    marketStatus: p.marketStatus,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  const category = req.query.category as string | undefined;
  const query = category ? { category } : {};
  const products = await Product.find(query);
  res.json(products.map(formatProduct));
});

router.post("/products", async (req, res) => {
  const parsed = createProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const revenue = parsed.data.price * parsed.data.soldUnits;
  const prod = await Product.create({
    ...parsed.data,
    revenue,
  });
  res.status(201).json(formatProduct(prod));
});

router.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const prod = await Product.findById(id);
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

router.put("/products/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const parsed = updateProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const prod = await Product.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

router.delete("/products/:id", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  await Product.findByIdAndDelete(id);
  res.json({ message: "Product deleted" });
});

router.post("/products/:id/offer", async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  
  const prod = await Product.findByIdAndUpdate(
    id, 
    { offerPercentage: parsed.data.offerPercentage }, 
    { new: true }
  );
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

export default router;
