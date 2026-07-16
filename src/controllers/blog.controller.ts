import { Request, Response } from "express";
import { BlogPostModel } from "../models/BlogPost";

export async function listBlogPosts(req: Request, res: Response) {
  const filter: Record<string, unknown> = { published: true };
  if (typeof req.query.category === "string") filter.category = req.query.category;
  if (typeof req.query.tag === "string") filter.tags = req.query.tag;

  const posts = await BlogPostModel.find(filter).sort({ publishedAt: -1 }).select("-blocks");
  return res.json(posts);
}

export async function getBlogPostBySlug(req: Request, res: Response) {
  const post = await BlogPostModel.findOne({ slug: req.params.slug, published: true });
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(post);
}
