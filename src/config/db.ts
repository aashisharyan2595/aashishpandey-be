import mongoose from "mongoose";
import { env } from "./env";

let connected = false;

// Fail fast instead of buffering queries for 10s when there's no active connection
// (e.g. MONGODB_URI isn't set yet during early development).
mongoose.set("bufferCommands", false);

export async function connectDb(): Promise<void> {
  if (connected || !env.mongoUri) return;
  await mongoose.connect(env.mongoUri);
  connected = true;
  console.log("MongoDB connected");
}
