import mongoose, { Schema, type Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  parentId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Department" },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDepartment>("Department", DepartmentSchema);
