import mongoose, { Schema, type Document } from "mongoose";

export interface IEmployeeDailyPerformance extends Document {
  date: string;
  data: any;
  createdAt: Date;
}

const EmployeeDailyPerformanceSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

EmployeeDailyPerformanceSchema.index({ date: 1 });

export default mongoose.model<IEmployeeDailyPerformance>("EmployeeDailyPerformance", EmployeeDailyPerformanceSchema);
