import { NextFunction, Request, Response } from "express";
import type { HydratedDocument } from "mongoose";
import type { User } from "../models/User";
import { resolveSession } from "../services/session.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: HydratedDocument<User>;
      sessionTokenId?: string;
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const resolved = await resolveSession(token);
  if (!resolved) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  req.adminUser = resolved.user;
  req.sessionTokenId = resolved.session.tokenId;
  next();
}
