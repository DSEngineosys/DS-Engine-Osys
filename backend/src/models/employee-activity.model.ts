import mongoose, { Schema, type Document } from "mongoose";

export interface IEmployeeActivity extends Document {
  employeeId: mongoose.Types.ObjectId;
  departmentName: string;
  subDepartment: string;
  activityType: string;
  payload: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeActivitySchema: Schema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    departmentName: { type: String, required: true },
    subDepartment: { type: String, required: true },
    activityType: { type: String, required: true }, // e.g., "Labour Task", "Packaging", "Meeting", "Sales"
    payload: { type: Schema.Types.Mixed, required: true }, // JSON object for dynamic fields
    status: { type: String, default: "submitted" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmployeeActivity>("EmployeeActivity", EmployeeActivitySchema);
