import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  hrId?: string;
  password?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  departmentId?: mongoose.Types.ObjectId;
  subDepartment?: string;
  phoneNumber?: string;
  monthlySalary?: number;
  resetOtp?: string;
  resetOtpExpires?: Date;
  lastOtpSentAt?: Date;
  performanceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    hrId: { type: String, unique: true, sparse: true },
    password: { type: String, default: "" },
    role: { type: String, default: "ds_engineer" },
    status: { type: String, default: "approved" },
    avatarUrl: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    subDepartment: { type: String },
    phoneNumber: { type: String },
    monthlySalary: { type: Number },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    lastOtpSentAt: { type: Date },
    performanceScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
