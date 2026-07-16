import { Schema, model, InferSchemaType } from "mongoose";

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    filename: { type: String, required: true },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
  },
  { timestamps: true }
);

export type Media = InferSchemaType<typeof mediaSchema>;
export const MediaModel = model("Media", mediaSchema);
