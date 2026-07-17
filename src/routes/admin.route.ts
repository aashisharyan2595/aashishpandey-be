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
  restoreRevision,
  updateBlogPost,
} from "../controllers/admin.controller";
import {
  bootstrap,
  bootstrapStatus,
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  resetPassword,
} from "../controllers/auth.controller";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { googleCallback, googleStart } from "../controllers/google-auth.controller";
import { deleteMedia, listMedia, uploadMedia } from "../controllers/media.controller";
import { approveUser, deleteUser, listUsers, rejectUser } from "../controllers/users.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAdmin } from "../middleware/requireAdmin";
import { upload } from "../middleware/upload";

export const adminRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth endpoints
adminRouter.get("/auth/bootstrap-status", asyncHandler(bootstrapStatus));
adminRouter.post("/auth/bootstrap", authLimiter, asyncHandler(bootstrap));
adminRouter.post("/auth/login", authLimiter, asyncHandler(login));
adminRouter.post("/auth/forgot-password", authLimiter, asyncHandler(forgotPassword));
adminRouter.post("/auth/reset-password", authLimiter, asyncHandler(resetPassword));
adminRouter.get("/auth/google", asyncHandler(googleStart));
adminRouter.get("/auth/google/callback", asyncHandler(googleCallback));

adminRouter.use(requireAdmin);

// Authenticated auth/session endpoints
adminRouter.get("/auth/me", asyncHandler(me));
adminRouter.post("/auth/logout", asyncHandler(logout));
adminRouter.post("/auth/logout-all", asyncHandler(logoutAll));

// User management (approve/reject sign-in requests)
adminRouter.get("/users", asyncHandler(listUsers));
adminRouter.post("/users/:id/approve", asyncHandler(approveUser));
adminRouter.post("/users/:id/reject", asyncHandler(rejectUser));
adminRouter.delete("/users/:id", asyncHandler(deleteUser));

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
