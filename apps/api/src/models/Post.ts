import { Schema, model, models } from "mongoose";

const postSchema = new Schema(
  {
    authorId: { type: String, ref: "User", required: true },
    fellowshipId: { type: Schema.Types.ObjectId, ref: "Fellowship", required: true },
    type: {
      type: String,
      enum: ["announcement", "testimony", "prayer_point"],
      required: true,
    },
    body: { type: String, required: true },
    mediaUrl: { type: String, default: null },
    seedCount: { type: Number, default: 0 },

    // Who can see this post. "fellowship" (default) keeps it inside the author's
    // fellowship; "public" surfaces it on the logged-out public feed. Extensible
    // to "ministry"/"church" later without a migration.
    visibility: {
      type: String,
      enum: ["fellowship", "public"],
      default: "fellowship",
    },
  },
  { timestamps: true }
);

postSchema.index({ fellowshipId: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });

export const Post = models.Post || model("Post", postSchema);
