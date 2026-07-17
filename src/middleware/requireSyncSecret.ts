import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// Gates the sync-receiver routes via a shared-secret header, not a user JWT —
// this is service-to-service (staging backend -> production backend), not an
// authenticated person. 404 on mismatch, matching blockAdminInProduction's
// don't-reveal-the-route behavior.
export function requireSyncSecret(req: Request, res: Response, next: NextFunction) {
  const provided = req.headers["x-sync-secret"];
  if (!env.contentSyncSecret || provided !== env.contentSyncSecret) {
    return res.status(404).end();
  }
  next();
}
