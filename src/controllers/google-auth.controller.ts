import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { UserModel } from "../models/User";
import { createSession } from "../services/session.service";

function client() {
  return new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleCallbackUrl);
}

export async function googleStart(_req: Request, res: Response) {
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({ error: "Google sign-in is not configured" });
  }

  const url = client().generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
  });
  return res.redirect(url);
}

function redirectWithError(res: Response, reason: string) {
  const url = new URL("/admin/login", env.appUrl);
  url.searchParams.set("error", reason);
  return res.redirect(url.toString());
}

export async function googleCallback(req: Request, res: Response) {
  if (!env.googleClientId || !env.googleClientSecret) {
    return res.status(503).json({ error: "Google sign-in is not configured" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  if (!code) return redirectWithError(res, "google_failed");

  const oauth2 = client();

  let email: string | undefined;
  let name: string | undefined;
  let googleId: string | undefined;

  try {
    const { tokens } = await oauth2.getToken(code);
    const ticket = await oauth2.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    email = payload?.email?.toLowerCase().trim();
    name = payload?.name ?? email;
    googleId = payload?.sub;
  } catch {
    return redirectWithError(res, "google_failed");
  }

  if (!email || !googleId) return redirectWithError(res, "google_failed");

  let user = await UserModel.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    const isFirstUser = (await UserModel.countDocuments()) === 0;
    user = await UserModel.create({
      name,
      email,
      googleId,
      status: isFirstUser ? "approved" : "pending",
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    await user.save();
  }

  if (user.status === "pending") return redirectWithError(res, "pending_approval");
  if (user.status === "rejected") return redirectWithError(res, "access_denied");

  user.lastLoginAt = new Date();
  await user.save();

  const token = await createSession(user, req.headers["user-agent"]);
  const url = new URL("/admin/oauth-callback", env.appUrl);
  url.searchParams.set("token", token);
  return res.redirect(url.toString());
}
