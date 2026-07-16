import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { BlogPostModel } from "../models/BlogPost";
import { SubmissionModel } from "../models/Submission";

const loginSchema = z.object({ password: z.string().min(1) });

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  if (!env.adminPassword || parsed.data.password !== env.adminPassword) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const token = jwt.sign({ role: "admin" }, env.adminJwtSecret, { expiresIn: "7d" });
  return res.json({ token });
}

export async function listSubmissions(_req: Request, res: Response) {
  const submissions = await SubmissionModel.find().sort({ createdAt: -1 });
  return res.json(submissions);
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
  type: z.enum(["heading", "paragraph", "image", "quote", "code"]),
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

export async function updateBlogPost(req: Request, res: Response) {
  const parsed = blogPostSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const existing = await BlogPostModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const nowPublishing = parsed.data.published && !existing.published;

  Object.assign(existing, parsed.data);
  if (nowPublishing) existing.publishedAt = new Date();

  await existing.save();
  return res.json(existing);
}

export async function deleteBlogPost(req: Request, res: Response) {
  const deleted = await BlogPostModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
}
