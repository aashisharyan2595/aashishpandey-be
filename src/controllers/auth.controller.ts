import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { UserModel } from "../models/User";
import { sendPasswordResetEmail } from "../services/email.service";
import { createSession, revokeAllSessions, revokeSession } from "../services/session.service";

const bootstrapSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  bootstrapSecret: z.string().optional(),
});

export async function bootstrap(req: Request, res: Response) {
  const existing = await UserModel.countDocuments();
  if (existing > 0) {
    return res.status(409).json({ error: "Admin account already set up" });
  }

  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  if (env.bootstrapSecret && parsed.data.bootstrapSecret !== env.bootstrapSecret) {
    return res.status(403).json({ error: "Invalid setup code" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    status: "approved",
    lastLoginAt: new Date(),
  });

  const token = await createSession(user, req.headers["user-agent"]);
  return res.status(201).json({ token });
}

export async function bootstrapStatus(_req: Request, res: Response) {
  const existing = await UserModel.countDocuments();
  return res.json({
    needsBootstrap: existing === 0,
    requiresSecret: Boolean(env.bootstrapSecret),
  });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase().trim() });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  if (user.status === "pending") {
    return res.status(403).json({ error: "Your access request is still pending approval" });
  }
  if (user.status === "rejected") {
    return res.status(403).json({ error: "Access denied" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = await createSession(user, req.headers["user-agent"]);
  return res.json({ token });
}

export async function me(req: Request, res: Response) {
  const user = req.adminUser!;
  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  });
}

export async function logout(req: Request, res: Response) {
  if (req.sessionTokenId) await revokeSession(req.sessionTokenId);
  return res.status(204).send();
}

export async function logoutAll(req: Request, res: Response) {
  const user = req.adminUser!;
  await revokeAllSessions(String(user._id));
  return res.status(204).send();
}

const forgotPasswordSchema = z.object({ email: z.string().email() });

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase().trim() });

  // Always return 204 regardless of whether the account exists, so this
  // endpoint can't be used to enumerate registered admin emails.
  if (user && user.passwordHash && user.status === "approved") {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${env.appUrl}/admin/reset-password/${rawToken}`,
    });
  }

  return res.status(204).send();
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await UserModel.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Reset link is invalid or has expired" });
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  await revokeAllSessions(String(user._id));

  return res.status(204).send();
}
