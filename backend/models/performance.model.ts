import mongoose, { Schema, type Document } from "mongoose";

export interface IPerformance extends Document {
  employeeId: mongoose.Types.ObjectId;
  period: string;
  score: number;
  tasksCompleted: number;
  tasksFailed: number;
  efficiency: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    period: { type: String, required: true },
    score: { type: Number, required: true },
    tasksCompleted: { type: Number, required: true },
    tasksFailed: { type: Number, required: true },
    efficiency: { type: Number, required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPerformance>("Performance", PerformanceSchema);
