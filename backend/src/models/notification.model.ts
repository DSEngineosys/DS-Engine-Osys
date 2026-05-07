import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId | null; // null means broadcast to all
  title: string;
  message: string;
  type: "info" | "registration_request";
  data?: {
    userId?: string;
  };
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "registration_request"], default: "info" },
  data: {
    userId: { type: String },
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
