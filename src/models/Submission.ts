import { Schema, model, InferSchemaType } from "mongoose";

const submissionSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    inquiryType: {
      type: String,
      enum: ["general", "recruiter", "project"],
      default: "general",
    },
    company: { type: String },
    role: { type: String },
    projectType: { type: String },
    budget: { type: String },
    timeline: { type: String },
  },
  { timestamps: true }
);

export type Submission = InferSchemaType<typeof submissionSchema>;
export const SubmissionModel = model("Submission", submissionSchema);
