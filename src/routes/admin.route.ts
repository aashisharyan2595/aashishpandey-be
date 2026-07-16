import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  autosaveBlogPost,
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  listAllBlogPosts,
  listRevisions,
  listSubmissions,
  login,
  restoreRevision,
  updateBlogPost,
} from "../controllers/admin.controller";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { deleteMedia, listMedia, uploadMedia } from "../controllers/media.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAdmin } from "../middleware/requireAdmin";
import { upload } from "../middleware/upload";

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
adminRouter.patch("/blog/:id/autosave", asyncHandler(autosaveBlogPost));
adminRouter.delete("/blog/:id", asyncHandler(deleteBlogPost));

adminRouter.get("/blog/:id/revisions", asyncHandler(listRevisions));
adminRouter.post("/blog/:id/revisions/:revisionId/restore", asyncHandler(restoreRevision));

adminRouter.get("/categories", asyncHandler(listCategories));
adminRouter.post("/categories", asyncHandler(createCategory));
adminRouter.put("/categories/:id", asyncHandler(updateCategory));
adminRouter.delete("/categories/:id", asyncHandler(deleteCategory));

adminRouter.get("/media", asyncHandler(listMedia));
adminRouter.post("/media", upload.single("file"), asyncHandler(uploadMedia));
adminRouter.delete("/media/:id", asyncHandler(deleteMedia));
