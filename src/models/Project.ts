import { Schema, model, InferSchemaType } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    liveUrl: { type: String },
    repoUrl: { type: String },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Project = InferSchemaType<typeof projectSchema>;
export const ProjectModel = model("Project", projectSchema);
