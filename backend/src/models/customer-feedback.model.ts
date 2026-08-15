import mongoose, { Schema, type Document } from "mongoose";

export interface ICustomerFeedback extends Document {
  employeeId: string;
  employeeName: string;
  customerName?: string;
  feedback: string;
  rating?: number;
  createdAt: Date;
}

const CustomerFeedbackSchema: Schema = new Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    customerName: { type: String },
    feedback: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomerFeedback>("CustomerFeedback", CustomerFeedbackSchema);
