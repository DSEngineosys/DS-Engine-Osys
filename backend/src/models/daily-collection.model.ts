import mongoose, { Schema, type Document } from "mongoose";

export interface IDailyCollection extends Document {
  date: string;
  type: "employee" | "product";
  data: any;
  createdAt: Date;
}

const DailyCollectionSchema: Schema = new Schema(
  {
    date: { type: String, required: true },
    type: { type: String, enum: ["employee", "product"], required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

DailyCollectionSchema.index({ date: 1, type: 1 });

export default mongoose.model<IDailyCollection>("DailyCollection", DailyCollectionSchema);
