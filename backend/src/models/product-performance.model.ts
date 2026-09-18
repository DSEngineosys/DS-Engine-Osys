import mongoose, { Schema, type Document } from "mongoose";

export interface IProductPerformance extends Document {
  date: string;
  data: any;
  createdAt: Date;
}

const ProductPerformanceSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

ProductPerformanceSchema.index({ date: 1 });

export default mongoose.model<IProductPerformance>("ProductPerformance", ProductPerformanceSchema);
