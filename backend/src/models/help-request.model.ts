import mongoose, { Schema, type Document } from "mongoose";

export interface IHelpRequest extends Document {
  employeeId: string;
  employeeName: string;
  department: string;
  subDepartment?: string;
  phoneNumber: string;
  email?: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const HelpRequestSchema: Schema = new Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    subDepartment: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    issueType: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IHelpRequest>("HelpRequest", HelpRequestSchema);
