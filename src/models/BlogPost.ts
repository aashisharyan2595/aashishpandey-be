import { Schema, model, InferSchemaType } from "mongoose";

const blockSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["heading", "paragraph", "image", "quote", "code"],
    },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    template: { type: String, default: "standard" },
    blocks: { type: [blockSchema], default: [] },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export type BlogPost = InferSchemaType<typeof blogPostSchema>;
export const BlogPostModel = model("BlogPost", blogPostSchema);
