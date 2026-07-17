import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

// The admin CMS must not be reachable at all on production — not even to
// bootstrap a founding admin. Only the internal sync receiver (/sync/*) stays
// open there, gated separately by requireSyncSecret. 404 (not 401) so a
// production visitor gets no hint the admin ever existed.
export function blockAdminInProduction(req: Request, res: Response, next: NextFunction) {
  if (env.deployEnv !== "production") return next();
  if (req.path.startsWith("/sync/")) return next();
  return res.status(404).end();
}
