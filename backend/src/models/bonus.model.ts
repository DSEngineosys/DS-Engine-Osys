import mongoose, { Schema, type Document } from "mongoose";

export interface IAssignedEmployee {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  assignedAt: Date;
  status: "assigned" | "claimed";
}

export interface IBonus extends Document {
  expiry?: Date;
  title: string;
  description: string;
  bonusAmount: string;
  departmentId?: mongoose.Types.ObjectId;
  departmentName?: string;
  subDepartment?: string;
  status: "active" | "expired";
  assignedEmployees: IAssignedEmployee[];
  createdAt: Date;
  updatedAt: Date;
}

const BonusSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    bonusAmount: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    departmentName: { type: String },
    subDepartment: { type: String, default: "" },
    expiry: { type: Date },
    status: { type: String, default: "active" },
    assignedEmployees: [
      {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        employeeName: { type: String, required: true },
        assignedAt: { type: Date, default: Date.now },
        status: { type: String, default: "assigned" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBonus>("Bonus", BonusSchema);
