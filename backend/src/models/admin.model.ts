import mongoose, { Schema, type Document } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  phoneNumber?: string;
  resetOtp?: string;
  resetOtpExpires?: Date;
  lastOtpSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    password: { type: String, default: "" },
    role: { type: String, default: "admin" },
    status: { type: String, default: "approved" },
    avatarUrl: { type: String },
    phoneNumber: { type: String },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    lastOtpSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAdmin>("Admin", AdminSchema);
