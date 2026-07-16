import { Router } from "express";
import { getBlogPostBySlug, listBlogPosts } from "../controllers/blog.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const blogRouter = Router();

blogRouter.get("/", asyncHandler(listBlogPosts));
blogRouter.get("/:slug", asyncHandler(getBlogPostBySlug));
