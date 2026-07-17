import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { SessionModel } from "../models/Session";
import type { HydratedDocument } from "mongoose";
import type { User } from "../models/User";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(
  user: HydratedDocument<User>,
  userAgent?: string
): Promise<string> {
  const tokenId = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await SessionModel.create({ user: user._id, tokenId, userAgent, expiresAt });

  return jwt.sign({ sid: tokenId }, env.adminJwtSecret, { expiresIn: "7d" });
}

export async function resolveSession(token: string) {
  let payload: { sid?: string };
  try {
    payload = jwt.verify(token, env.adminJwtSecret) as { sid?: string };
  } catch {
    return null;
  }
  if (!payload.sid) return null;

  const session = await SessionModel.findOne({ tokenId: payload.sid }).populate<{
    user: HydratedDocument<User>;
  }>("user");

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user || session.user.status !== "approved") return null;

  return { session, user: session.user };
}

export async function revokeSession(tokenId: string) {
  await SessionModel.updateOne({ tokenId }, { revokedAt: new Date() });
}

export async function revokeAllSessions(userId: string) {
  await SessionModel.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );
}
