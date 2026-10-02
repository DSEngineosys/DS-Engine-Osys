import { Router } from "express";
import Product from "../models/product.model";
import mongoose from "mongoose";
import { z } from "zod";
import { checkAndCleanExpiredProductOffers } from "../services/product-offer-cleaner";

const router = Router();

const createProdSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  type: z.string().optional(),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  batchNumber: z.string().optional(),
  mrp: z.number().optional(),
  price: z.number(),
  stock: z.number().int(),
  soldUnits: z.number().int().optional(),
  discountPercent: z.number().optional(),
  taxPercent: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  marketStatus: z.enum(["high_demand", "moderate", "low_demand", "critical"]).optional(),
});

const updateProdSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  type: z.string().optional(),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  batchNumber: z.string().optional(),
  mrp: z.number().optional(),
  price: z.number().optional(),
  stock: z.number().int().optional(),
  soldUnits: z.number().int().optional(),
  discountPercent: z.number().optional(),
  taxPercent: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  marketStatus: z.enum(["high_demand", "moderate", "low_demand", "critical"]).optional(),
});

const offerSchema = z.object({
  offerPercentage: z.number().min(1).max(100),
  durationMinutes: z.number().positive().optional().default(60),
  reason: z.string().optional(),
  offerName: z.string().optional(),
  priority: z.number().optional(),
});

export function formatProduct(p: any) {
  const now = new Date();
  const isOfferActive = p.offerExpiresAt ? new Date(p.offerExpiresAt) > now : false;
  const offerRemainingSeconds = isOfferActive ? Math.max(0, Math.floor((new Date(p.offerExpiresAt).getTime() - now.getTime()) / 1000)) : 0;
  const calcOfferPct = isOfferActive ? Number(p.offerPercentage || p.discountPercent || 0) : null;

  return {
    id: p._id ? p._id.toString() : p.productId,
    _id: p._id ? p._id.toString() : p.productId,
    productId: p.productId || (p._id ? p._id.toString() : ""),
    sku: p.sku || p.productId || (p._id ? p._id.toString() : ""),
    name: p.name || p.productName,
    productName: p.name || p.productName,
    category: p.category,
    subCategory: p.subCategory || "",
    type: p.type || "",
    gender: p.gender || "Both",
    ageGroup: p.ageGroup || "All Ages",
    batchNumber: p.batchNumber || "",
    manufactureDate: p.manufactureDate ? new Date(p.manufactureDate).toISOString() : undefined,
    expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString() : undefined,
    mrp: Number(p.mrp || p.price || 0),
    discountPercent: calcOfferPct || 0,
    taxPercent: Number(p.taxPercent || 18),
    price: Number(p.price || 0),
    sellingPrice: isOfferActive && calcOfferPct ? Number((Number(p.price || 0) * (1 - calcOfferPct / 100)).toFixed(2)) : Number(p.price || 0),
    stock: p.stock ?? 0,
    stockQuantity: p.stock ?? 0,
    soldUnits: p.soldUnits || 0,
    revenue: Number(p.revenue || 0),
    offerPercentage: calcOfferPct,
    offerAppliedAt: p.offerAppliedAt ? new Date(p.offerAppliedAt).toISOString() : undefined,
    offerDurationMinutes: p.offerDurationMinutes || 60,
    offerExpiresAt: p.offerExpiresAt ? new Date(p.offerExpiresAt).toISOString() : undefined,
    isOfferActive,
    offerRemainingSeconds,
    activeOfferDetails: isOfferActive ? p.activeOfferDetails || null : null,
    marketStatus: p.marketStatus || "moderate",
    status: p.status || "active",
    ingredients: p.ingredients || [],
    description: p.description || "",
    productDescription: p.description || "",
    imageUrl: p.imageUrl || "",
    image: p.imageUrl || "",
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  };
}

// GET all products with optional filters (category, search, marketStatus)
router.get("/products", async (req, res) => {
  try {
    await checkAndCleanExpiredProductOffers();
    const { category, search, marketStatus } = req.query;
    const query: Record<string, any> = {};

    if (category && category !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (marketStatus && marketStatus !== "all") {
      query.marketStatus = marketStatus;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { productId: { $regex: term, $options: "i" } },
        { sku: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { subCategory: { $regex: term, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", message: String(err) });
  }
});



// CREATE new product
router.post("/products", async (req, res) => {
  const parsed = createProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const soldUnits = parsed.data.soldUnits || 0;
  const revenue = parsed.data.price * soldUnits;
  const prod = await Product.create({
    ...parsed.data,
    soldUnits,
    revenue,
  });
  res.status(201).json(formatProduct(prod));
});

// GET unique categories
router.get("/products/categories", async (_req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json(categories.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories", message: String(err) });
  }
});

// GET single product by ID or productId
router.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  let prod = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    prod = await Product.findById(id);
  }

  if (!prod) {
    prod = await Product.findOne({
      $or: [{ productId: id }, { sku: id }],
    });
  }

  if (!prod) {
    res.status(404).json({ error: "Not found", message: "Product not found" });
    return;
  }
  res.json(formatProduct(prod));
});

// UPDATE product
router.put("/products/:id", async (req, res) => {
  const id = req.params.id;
  const parsed = updateProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  let prod = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    prod = await Product.findByIdAndUpdate(id, parsed.data, { returnDocument: "after" });
  } else {
    prod = await Product.findOneAndUpdate(
      { $or: [{ productId: id }, { sku: id }] },
      parsed.data,
      { returnDocument: "after" }
    );
  }

  if (!prod) {
    res.status(404).json({ error: "Not found", message: "Product not found" });
    return;
  }
  res.json(formatProduct(prod));
});

// DELETE product
router.delete("/products/:id", async (req, res) => {
  const id = req.params.id;
  let prod = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    prod = await Product.findByIdAndDelete(id);
  } else {
    prod = await Product.findOneAndDelete({
      $or: [{ productId: id }, { sku: id }],
    });
  }

  if (!prod) {
    res.status(404).json({ error: "Not found", message: "Product not found" });
    return;
  }
  res.json({ message: "Product deleted" });
});

// SET special offer percentage (with timestamp & time limit enforcement)
router.post("/products/:id/offer", async (req, res) => {
  const id = req.params.id;
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  let existing: any = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    existing = await Product.findById(id);
  } else {
    existing = await Product.findOne({ $or: [{ productId: id }, { sku: id }] });
  }

  if (!existing) {
    res.status(404).json({ error: "Not found", message: "Product not found" });
    return;
  }

  // Check if current offer is still within its active time-limit
  const now = new Date();
  if (existing.offerExpiresAt && new Date(existing.offerExpiresAt) > now) {
    const remainingMs = new Date(existing.offerExpiresAt).getTime() - now.getTime();
    const remainingMins = Math.ceil(remainingMs / (1000 * 60));
    res.status(409).json({
      error: "Offer active",
      message: `Product "${existing.name}" already has an active offer applied until ${new Date(existing.offerExpiresAt).toLocaleTimeString()} (${remainingMins} mins remaining). You cannot apply another offer until the time limit expires.`,
      activeUntil: existing.offerExpiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
    });
    return;
  }

  // Set new offer timestamp & expiration time-limit
  const durationMinutes = parsed.data.durationMinutes || 60;
  const offerExpiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  const updateData = {
    offerPercentage: parsed.data.offerPercentage,
    discountPercent: parsed.data.offerPercentage,
    offerAppliedAt: now,
    offerDurationMinutes: durationMinutes,
    offerExpiresAt: offerExpiresAt,
    activeOfferDetails: {
      offerName: parsed.data.offerName || `${parsed.data.offerPercentage}% Discount Offer`,
      priority: parsed.data.priority,
      reason: parsed.data.reason || "ML Offer Applied",
      appliedAt: now.toISOString(),
      expiresAt: offerExpiresAt.toISOString(),
    },
  };

  const updatedProd = await Product.findByIdAndUpdate(existing._id, updateData, { returnDocument: "after" });
  res.json(formatProduct(updatedProd));
});

export default router;
