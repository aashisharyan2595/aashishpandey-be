import { Schema, model, InferSchemaType } from "mongoose";

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export type BlogPost = InferSchemaType<typeof blogPostSchema>;
export const BlogPostModel = model("BlogPost", blogPostSchema);
