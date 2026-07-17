import { Schema, model, InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenId: { type: String, required: true, unique: true },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

export type Session = InferSchemaType<typeof sessionSchema>;
export const SessionModel = model("Session", sessionSchema);
