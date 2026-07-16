import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  listAllBlogPosts,
  listSubmissions,
  login,
  updateBlogPost,
} from "../controllers/admin.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAdmin } from "../middleware/requireAdmin";

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

adminRouter.post("/login", loginLimiter, asyncHandler(login));

adminRouter.use(requireAdmin);

adminRouter.get("/submissions", asyncHandler(listSubmissions));

adminRouter.get("/blog", asyncHandler(listAllBlogPosts));
adminRouter.get("/blog/:id", asyncHandler(getBlogPostById));
adminRouter.post("/blog", asyncHandler(createBlogPost));
adminRouter.put("/blog/:id", asyncHandler(updateBlogPost));
adminRouter.delete("/blog/:id", asyncHandler(deleteBlogPost));
