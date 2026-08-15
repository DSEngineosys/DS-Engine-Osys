import mongoose, { Schema, type Document } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  employeeId: string;
  departmentId: mongoose.Types.ObjectId;
  subDepartment?: string;
  designation: string;
  joiningDate: Date;
  status: string;
  accountStatus: string;
  contactNumber?: string;
  gender?: string;
  location?: string;
  employmentType?: string;
  shift?: string;
  monthlySalary?: number;
  password?: string;
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
    subDepartment: { type: String },
    designation: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    status: { type: String, required: true, default: "active" },
    accountStatus: { type: String, default: "Active" },
    contactNumber: { type: String },
    gender: { type: String },
    location: { type: String },
    employmentType: { type: String, default: "Fulltime" },
    shift: { type: String },
    monthlySalary: { type: Number },
    password: { type: String, default: "" },
    performanceScore: { type: Number, default: 0 },
    avatarUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
