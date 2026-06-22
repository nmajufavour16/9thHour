import { Schema, model, models } from "mongoose";

const fellowshipSchema = new Schema(
  {
    name: { type: String, required: true },
    campus: { type: String, required: true },
    leadMinisterId: { type: String, ref: "User", required: true },
    description: { type: String, default: null },
    isPrivate: { type: Boolean, default: true },
    joinCode: { type: String, default: null },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

fellowshipSchema.index({ campus: 1 });

export const Fellowship = models.Fellowship || model("Fellowship", fellowshipSchema);
