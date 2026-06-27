import { Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    prayerRequestId: { type: Schema.Types.ObjectId, ref: "PrayerRequest", required: true },
    authorId: { type: String, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

commentSchema.index({ prayerRequestId: 1, createdAt: 1 });

export const Comment = models.Comment || model("Comment", commentSchema);
