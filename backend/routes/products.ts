import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
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
  const products = category
    ? await db.select().from(productsTable).where(eq(productsTable.category, category))
    : await db.select().from(productsTable);
  res.json(products.map(formatProduct));
});

router.post("/products", async (req, res) => {
  const parsed = createProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const revenue = parsed.data.price * parsed.data.soldUnits;
  const [prod] = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    cost: String(parsed.data.cost),
    revenue: String(revenue),
    soldUnits: parsed.data.soldUnits,
  }).returning();
  res.status(201).json(formatProduct(prod));
});

router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [prod] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = updateProdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);
  if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;
  if (parsed.data.soldUnits !== undefined) updateData.soldUnits = parsed.data.soldUnits;
  if (parsed.data.marketStatus !== undefined) updateData.marketStatus = parsed.data.marketStatus;

  const [prod] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

router.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ message: "Product deleted" });
});

router.post("/products/:id/offer", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }
  const [prod] = await db.update(productsTable)
    .set({ offerPercentage: String(parsed.data.offerPercentage) })
    .where(eq(productsTable.id, id))
    .returning();
  if (!prod) { res.status(404).json({ error: "Not found", message: "Product not found" }); return; }
  res.json(formatProduct(prod));
});

export default router;
