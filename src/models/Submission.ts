import { Schema, model, InferSchemaType } from "mongoose";

const submissionSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export type Submission = InferSchemaType<typeof submissionSchema>;
export const SubmissionModel = model("Submission", submissionSchema);
