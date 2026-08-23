import mongoose, { Schema, type Document } from "mongoose";

export interface IHR extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const HRSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    password: { type: String, default: "" },
    role: { type: String, default: "hr" },
    status: { type: String, default: "approved" },
    avatarUrl: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    subDepartmentId: { type: Schema.Types.ObjectId, ref: "SubDepartment" },
    phoneNumber: { type: String },
    monthlySalary: { type: Number },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IHR>("HR", HRSchema);
