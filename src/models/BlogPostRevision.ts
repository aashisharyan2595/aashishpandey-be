import { Schema, model, InferSchemaType } from "mongoose";

const revisionSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export type BlogPostRevision = InferSchemaType<typeof revisionSchema>;
export const BlogPostRevisionModel = model("BlogPostRevision", revisionSchema);
