import mongoose, { Schema, type Document } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  employeeId: string;
  departmentId: mongoose.Types.ObjectId;
  designation: string;
  joiningDate: Date;
  status: string;
  performanceScore?: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    designation: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, required: true, default: "active" },
    performanceScore: { type: Number },
    avatarUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
