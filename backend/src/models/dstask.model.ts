import mongoose, { Schema, type Document } from "mongoose";

export interface IDSTask extends Document {
  title: string;
  description: string;
  departmentName: string;
  subDepartmentName: string;
  requiresQuantity: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DSTaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    departmentName: { type: String, required: true },
    subDepartmentName: { type: String, required: true },
    requiresQuantity: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDSTask>("DSTask", DSTaskSchema);
