import mongoose, { Schema, type Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  employeeId: mongoose.Types.ObjectId;
  status: string;
  priority: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    status: { type: String, required: true, default: "pending" },
    priority: { type: String, required: true, default: "medium" },
    dueDate: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITask>("Task", TaskSchema);
