import mongoose, { Schema, type Document } from "mongoose";

export interface ISubDepartment extends Document {
  name: string;
  departmentId: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubDepartmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubDepartment>("SubDepartment", SubDepartmentSchema);
