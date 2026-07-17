import { Request, Response } from "express";
import { Model } from "mongoose";
import { z } from "zod";
import { BlogPostModel } from "../models/BlogPost";
import { CaseStudyModel } from "../models/CaseStudy";
import { CategoryModel } from "../models/Category";
import { MediaModel } from "../models/Media";

// Production-side receiver logic. Every route here sits behind
// requireSyncSecret (service-to-service auth), never requireAdmin — the
// caller is the staging backend, not a logged-in person. Payloads from
// staging are re-validated here too; never trust the sender blindly, in case
// the two deploys drift out of version sync.

const blockSchema = z.object({
  type: z.enum([
    "heading",
    "paragraph",
    "image",
    "quote",
    "code",
    "divider",
    "button",
    "gallery",
    "video",
    "embed",
    "html",
  ]),
  data: z.unknown(),
});

const blogPostPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  excerpt: z.string().min(1).max(500),
  template: z.string().min(1).max(50).default("standard"),
  blocks: z.array(blockSchema).default([]),
  coverImage: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  category: z.string().max(100).optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  published: z.boolean(),
  publishedAt: z.coerce.date().optional(),
});

const caseStudyPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  client: z.string().min(1).max(200),
  timeframe: z.string().min(1).max(100),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string()).default([]),
  problem: z.string().min(1),
  approach: z.string().min(1),
  outcome: z.string().min(1),
  metric: z.object({
    value: z.string().min(1).max(50),
    label: z.string().min(1).max(200),
  }),
  coverImage: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  order: z.number().default(0),
  published: z.boolean(),
});

const categoryPayloadSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});

const mediaPayloadSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1),
  filename: z.string().min(1),
  alt: z.string().max(300).default(""),
  format: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
});

// ---- Per-item push (blog posts, case studies) ----

async function pushOne(
  model: Model<any>,
  schema: z.ZodTypeAny,
  req: Request,
  res: Response
) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid sync payload", details: parsed.error.flatten() });
  }

  const data = parsed.data as { slug: string; published: boolean };

  if (!data.published) {
    await model.deleteOne({ slug: data.slug });
    return res.json({ action: "deleted", slug: data.slug });
  }

  const doc = await model.findOneAndUpdate(
    { slug: data.slug },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.json({ action: "upserted", doc });
}

export async function receiveBlogPostPush(req: Request, res: Response) {
  return pushOne(BlogPostModel, blogPostPayloadSchema, req, res);
}

export async function receiveCaseStudyPush(req: Request, res: Response) {
  return pushOne(CaseStudyModel, caseStudyPayloadSchema, req, res);
}

// ---- Bulk reconcile (blog posts, case studies, categories, media) ----

const reconcileRequestSchema = z.object({
  items: z.array(z.record(z.unknown())),
  confirmEmpty: z.boolean().optional(),
});

async function reconcileCollection(
  model: Model<any>,
  keyField: string,
  itemSchema: z.ZodTypeAny,
  req: Request,
  res: Response
) {
  const parsedRequest = reconcileRequestSchema.safeParse(req.body);
  if (!parsedRequest.success) {
    return res.status(400).json({ error: "Invalid reconcile payload", details: parsedRequest.error.flatten() });
  }

  const { items, confirmEmpty } = parsedRequest.data;

  const parsedItems: Record<string, unknown>[] = [];
  for (const item of items) {
    const parsed = itemSchema.safeParse(item);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid item in reconcile payload", details: parsed.error.flatten() });
    }
    parsedItems.push(parsed.data as Record<string, unknown>);
  }

  const existingCount = await model.countDocuments();
  if (parsedItems.length === 0 && existingCount > 0 && !confirmEmpty) {
    return res.status(400).json({
      error: "Refusing to reconcile an empty item list against a non-empty collection — pass confirmEmpty: true if this is intentional",
    });
  }

  // Upsert first, delete last — biases toward "stale but present" over data
  // loss if this request fails partway through.
  if (parsedItems.length > 0) {
    await model.bulkWrite(
      parsedItems.map((item) => ({
        updateOne: {
          filter: { [keyField]: item[keyField] },
          update: { $set: item },
          upsert: true,
        },
      }))
    );
  }

  const incomingKeys = parsedItems.map((item) => item[keyField]);
  const deleteResult = await model.find({ [keyField]: { $nin: incomingKeys } }).select(keyField);
  const deletedKeys = deleteResult.map((doc: any) => doc[keyField]);
  if (deletedKeys.length > 0) {
    await model.deleteMany({ [keyField]: { $nin: incomingKeys } });
  }

  return res.json({ upserted: parsedItems.length, deleted: deletedKeys.length, deletedKeys });
}

export async function reconcileBlogPosts(req: Request, res: Response) {
  return reconcileCollection(BlogPostModel, "slug", blogPostPayloadSchema, req, res);
}

export async function reconcileCaseStudies(req: Request, res: Response) {
  return reconcileCollection(CaseStudyModel, "slug", caseStudyPayloadSchema, req, res);
}

export async function reconcileCategories(req: Request, res: Response) {
  return reconcileCollection(CategoryModel, "slug", categoryPayloadSchema, req, res);
}

export async function reconcileMedia(req: Request, res: Response) {
  return reconcileCollection(MediaModel, "publicId", mediaPayloadSchema, req, res);
}
