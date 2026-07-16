import { Request, Response } from "express";
import { BlogPostModel } from "../models/BlogPost";

export async function listBlogPosts(_req: Request, res: Response) {
  const posts = await BlogPostModel.find({ published: true })
    .sort({ publishedAt: -1 })
    .select("-blocks");
  return res.json(posts);
}

export async function getBlogPostBySlug(req: Request, res: Response) {
  const post = await BlogPostModel.findOne({ slug: req.params.slug, published: true });
  if (!post) return res.status(404).json({ error: "Not found" });
  return res.json(post);
}
