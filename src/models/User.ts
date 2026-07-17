import { Schema, model, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },
    lastLoginAt: { type: Date },
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
