import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  category: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  soldUnits: number;
  revenue: number;
  offerPercentage?: number;
  marketStatus: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    stock: { type: Number, required: true },
    soldUnits: { type: Number, required: true, default: 0 },
    revenue: { type: Number, required: true, default: 0 },
    offerPercentage: { type: Number },
    marketStatus: { type: String, required: true, default: "moderate" },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProduct>("Product", ProductSchema);
