import mongoose, { Schema, type Document } from "mongoose";

export interface IDSEngineer extends Document {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  departmentId?: mongoose.Types.ObjectId;
  subDepartmentId?: mongoose.Types.ObjectId;
  phoneNumber?: string;
  monthlySalary?: number;
  performanceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DSEngineerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    password: { type: String, default: "" },
    role: { type: String, default: "ds_engineer" },
    status: { type: String, default: "approved" },
    avatarUrl: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    subDepartmentId: { type: Schema.Types.ObjectId, ref: "SubDepartment" },
    phoneNumber: { type: String },
    monthlySalary: { type: Number },
    performanceScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDSEngineer>("DSEngineer", DSEngineerSchema);
