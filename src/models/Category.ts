import { Schema, model, InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model("Category", categorySchema);
