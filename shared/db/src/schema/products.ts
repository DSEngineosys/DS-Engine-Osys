import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  sku: text("sku").notNull().unique(),
  price: numeric("price").notNull(),
  cost: numeric("cost").notNull(),
  stock: integer("stock").notNull(),
  soldUnits: integer("sold_units").notNull().default(0),
  revenue: numeric("revenue").notNull().default("0"),
  offerPercentage: numeric("offer_percentage"),
  marketStatus: text("market_status").notNull().default("moderate"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
