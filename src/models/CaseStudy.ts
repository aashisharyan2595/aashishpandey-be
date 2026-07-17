import { Schema, model, InferSchemaType } from "mongoose";

const metricSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const caseStudySchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    client: { type: String, required: true },
    timeframe: { type: String, required: true },
    summary: { type: String, required: true },
    tags: { type: [String], default: [] },
    problem: { type: String, required: true },
    approach: { type: String, required: true },
    outcome: { type: String, required: true },
    metric: { type: metricSchema, required: true },
    coverImage: { type: String },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type CaseStudy = InferSchemaType<typeof caseStudySchema>;
export const CaseStudyModel = model("CaseStudy", caseStudySchema);
