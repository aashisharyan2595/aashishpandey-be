import { Request, Response } from "express";
import { z } from "zod";
import { BlogPostModel } from "../models/BlogPost";
import { BlogPostRevisionModel } from "../models/BlogPostRevision";
import { MediaModel } from "../models/Media";
import { SubmissionModel } from "../models/Submission";

const MAX_REVISIONS = 20;

export async function listSubmissions(_req: Request, res: Response) {
  const submissions = await SubmissionModel.find().sort({ createdAt: -1 });
  return res.json(submissions);
}

export async function getDashboardStats(_req: Request, res: Response) {
  const [published, drafts, submissionCount, mediaCount, recentPosts, recentSubmissions] =
    await Promise.all([
      BlogPostModel.countDocuments({ published: true }),
      BlogPostModel.countDocuments({ published: false }),
      SubmissionModel.countDocuments(),
      MediaModel.countDocuments(),
      BlogPostModel.find().sort({ updatedAt: -1 }).limit(5).select("title slug published updatedAt"),
      SubmissionModel.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
    ]);

  return res.json({
    posts: { published, drafts, total: published + drafts },
    submissions: submissionCount,
    media: mediaCount,
    recentPosts,
    recentSubmissions,
  });
}

export async function listAllBlogPosts(_req: Request, res: Response) {
  const posts = await BlogPostModel.find().sort({ updatedAt: -1 });
  return res.json(posts);
}

export async function getBlogPostById(req: Request, res: Response) {
  const post = await BlogPostModel.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(post);
}

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

const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  excerpt: z.string().min(1).max(500),
  template: z.string().min(1).max(50).default("standard"),
  blocks: z.array(blockSchema).default([]),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  category: z.string().max(100).optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  ogImage: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(false),
});

export async function createBlogPost(req: Request, res: Response) {
  const parsed = blogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const post = await BlogPostModel.create({
    ...parsed.data,
    publishedAt: parsed.data.published ? new Date() : undefined,
  });
  return res.status(201).json(post);
}

async function recordRevision(postId: string, snapshot: Record<string, unknown>) {
  await BlogPostRevisionModel.create({ post: postId, snapshot });
  const revisions = await BlogPostRevisionModel.find({ post: postId })
    .sort({ createdAt: -1 })
    .skip(MAX_REVISIONS)
    .select("_id");
  if (revisions.length > 0) {
    await BlogPostRevisionModel.deleteMany({ _id: { $in: revisions.map((r) => r._id) } });
  }
}

export async function updateBlogPost(req: Request, res: Response) {
  const parsed = blogPostSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const existing = await BlogPostModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  await recordRevision(existing.id, existing.toObject());

  const nowPublishing = parsed.data.published && !existing.published;

  Object.assign(existing, parsed.data);
  existing.autosave = undefined;
  if (nowPublishing) existing.publishedAt = new Date();

  await existing.save();
  return res.json(existing);
}

const autosaveSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  blocks: z.array(blockSchema).optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

export async function autosaveBlogPost(req: Request, res: Response) {
  const parsed = autosaveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const existing = await BlogPostModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const savedAt = new Date();
  existing.set("autosave", { ...parsed.data, savedAt });
  await existing.save();
  return res.json({ savedAt });
}

export async function deleteBlogPost(req: Request, res: Response) {
  const deleted = await BlogPostModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  await BlogPostRevisionModel.deleteMany({ post: deleted.id });
  return res.status(204).send();
}

export async function listRevisions(req: Request, res: Response) {
  const revisions = await BlogPostRevisionModel.find({ post: req.params.id })
    .sort({ createdAt: -1 })
    .select("_id createdAt snapshot.title snapshot.excerpt");
  return res.json(revisions);
}

export async function restoreRevision(req: Request, res: Response) {
  const existing = await BlogPostModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const revision = await BlogPostRevisionModel.findOne({
    _id: req.params.revisionId,
    post: req.params.id,
  });
  if (!revision) return res.status(404).json({ error: "Revision not found" });

  await recordRevision(existing.id, existing.toObject());

  const snapshot = revision.snapshot as Record<string, unknown>;
  const restorable = blogPostSchema.partial().safeParse(snapshot);
  if (!restorable.success) {
    return res.status(500).json({ error: "Stored revision is corrupt" });
  }

  Object.assign(existing, restorable.data);
  existing.autosave = undefined;
  await existing.save();
  return res.json(existing);
}
