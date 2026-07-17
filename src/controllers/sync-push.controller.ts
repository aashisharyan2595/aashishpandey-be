import { Request, Response } from "express";
import { env } from "../config/env";
import { BlogPostModel } from "../models/BlogPost";
import { CaseStudyModel } from "../models/CaseStudy";
import { CategoryModel } from "../models/Category";
import { MediaModel } from "../models/Media";

// Staging-side logic: calls out to the production backend's internal sync
// receiver via a shared-secret header. Only meaningful when PRODUCTION_API_URL
// is configured (staging only) — on production itself these routes exist
// (shared code) but are never invoked by anything, and blockAdminInProduction
// already 404s every /api/admin/* route except /sync/* on that side anyway.

class SyncConfigError extends Error {}
class SyncPushError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(body || `Production sync request failed (${status})`);
    this.status = status;
  }
}

async function callProductionSync(path: string, body: unknown) {
  if (!env.productionApiUrl) {
    throw new SyncConfigError("PRODUCTION_API_URL is not configured on this environment");
  }
  const res = await fetch(`${env.productionApiUrl}/api/admin/sync/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sync-secret": env.contentSyncSecret },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SyncPushError(res.status, text);
  }
  return (await res.json()) as Record<string, unknown>;
}

function stripEnvSpecificFields<T extends Record<string, any>>(doc: T) {
  const { _id, createdAt, updatedAt, __v, autosave, ...rest } = doc;
  return rest;
}

async function respondWithSyncError(res: Response, error: unknown) {
  if (error instanceof SyncConfigError) {
    return res.status(500).json({ error: error.message });
  }
  if (error instanceof SyncPushError) {
    const message =
      error.status === 404
        ? "Production rejected the sync request (secret mismatch or misconfiguration)"
        : error.message;
    return res.status(502).json({ error: message });
  }
  throw error;
}

export async function pushBlogPost(req: Request, res: Response) {
  const post = await BlogPostModel.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });

  try {
    const result = await callProductionSync("blog/push", stripEnvSpecificFields(post.toObject()));
    return res.json({ ok: true, ...result });
  } catch (error) {
    return respondWithSyncError(res, error);
  }
}

export async function pushCaseStudy(req: Request, res: Response) {
  const caseStudy = await CaseStudyModel.findById(req.params.id);
  if (!caseStudy) return res.status(404).json({ error: "Not found" });

  try {
    const result = await callProductionSync(
      "case-studies/push",
      stripEnvSpecificFields(caseStudy.toObject())
    );
    return res.json({ ok: true, ...result });
  } catch (error) {
    return respondWithSyncError(res, error);
  }
}

async function reconcileOne(collection: string, path: string, items: Record<string, any>[]) {
  try {
    const result = await callProductionSync(path, { items });
    return { collection, ok: true, ...result };
  } catch (error) {
    const message =
      error instanceof SyncPushError && error.status === 404
        ? "Production rejected the sync request (secret mismatch or misconfiguration)"
        : error instanceof Error
          ? error.message
          : "Unknown error";
    return { collection, ok: false, error: message };
  }
}

export async function syncAllToProduction(_req: Request, res: Response) {
  if (!env.productionApiUrl) {
    return res.status(500).json({ error: "PRODUCTION_API_URL is not configured on this environment" });
  }

  const [posts, caseStudies, categories, media] = await Promise.all([
    BlogPostModel.find({ published: true }),
    CaseStudyModel.find({ published: true }),
    CategoryModel.find(),
    MediaModel.find(),
  ]);

  const results = await Promise.all([
    reconcileOne(
      "blog",
      "blog/reconcile",
      posts.map((p) => stripEnvSpecificFields(p.toObject()))
    ),
    reconcileOne(
      "case-studies",
      "case-studies/reconcile",
      caseStudies.map((c) => stripEnvSpecificFields(c.toObject()))
    ),
    reconcileOne(
      "categories",
      "categories/reconcile",
      categories.map((c) => stripEnvSpecificFields(c.toObject()))
    ),
    reconcileOne(
      "media",
      "media/reconcile",
      media.map((m) => stripEnvSpecificFields(m.toObject()))
    ),
  ]);

  const overallOk = results.every((r: { ok: boolean }) => r.ok);
  return res.status(overallOk ? 200 : 207).json({ results, overallOk });
}
