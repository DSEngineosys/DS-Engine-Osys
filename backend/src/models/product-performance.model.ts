import mongoose, { Schema, type Document } from "mongoose";

export interface IProductPerformance extends Document {
  productId?: string;
  productName?: string;
  category?: string;
  soldDate?: Date;
  sellingTimePeriod?: number;
  profit?: number;
  offerAmount?: number;
  offersApplied?: string;
  date?: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ProductPerformanceSchema: Schema = new Schema(
  {
    productId: { type: String, index: true },
    productName: { type: String },
    category: { type: String, index: true },
    soldDate: { type: Date, index: true },
    sellingTimePeriod: { type: Number },
    profit: { type: Number },
    offerAmount: { type: Number },
    offersApplied: { type: String },
    date: { type: String, index: true },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ProductPerformanceSchema.index({ productId: 1, soldDate: -1 });

export default mongoose.model<IProductPerformance>("ProductPerformance", ProductPerformanceSchema);
