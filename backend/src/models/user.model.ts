import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    password: { type: String, default: "" },
    role: { type: String, default: "ds_engineer" },
    status: { type: String, default: "approved" },
    avatarUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
