import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  sku?: string;
  name: string;
  category: string;
  subCategory?: string;
  type?: string;
  description?: string;
  ingredients?: string[];
  ageGroup?: string;
  gender?: string;
  manufactureDate?: Date;
  expiryDate?: Date;
  batchNumber?: string;
  mrp: number;
  cost?: number;
  discountPercent?: number;
  taxPercent?: number;
  price: number;
  stock: number;
  soldUnits: number;
  revenue: number;
  offerPercentage?: number;
  marketStatus: string;
  status: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    productId: { type: String, unique: true, sparse: true },
    sku: { type: String },
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    type: { type: String },
    description: { type: String },
    ingredients: [{ type: String }],
    ageGroup: { type: String },
    gender: { type: String },
    manufactureDate: { type: Date },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    mrp: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    soldUnits: { type: Number, required: true, default: 0 },
    revenue: { type: Number, required: true, default: 0 },
    offerPercentage: { type: Number },
    marketStatus: { type: String, required: true, default: "moderate" },
    status: { type: String, default: "active" },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProduct>("Product", ProductSchema);
