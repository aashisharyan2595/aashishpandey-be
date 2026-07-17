import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  autosaveBlogPost,
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getDashboardStats,
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
  createCaseStudy,
  deleteCaseStudy,
  getCaseStudyById,
  listAllCaseStudies,
  updateCaseStudy,
} from "../controllers/case-study.controller";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { googleCallback, googleStart } from "../controllers/google-auth.controller";
import {
  deleteMedia,
  listMedia,
  updateMedia,
  uploadMedia,
  uploadMediaBulk,
} from "../controllers/media.controller";
import { pushBlogPost, pushCaseStudy, syncAllToProduction } from "../controllers/sync-push.controller";
import { approveUser, deleteUser, listUsers, rejectUser } from "../controllers/users.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { blockAdminInProduction } from "../middleware/blockAdminInProduction";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireSyncSecret } from "../middleware/requireSyncSecret";
import { upload } from "../middleware/upload";
import { syncRouter } from "./sync.route";

export const adminRouter = Router();

// Must be first: on production, this 404s every route below except /sync/*,
// so the CMS (including bootstrap) is entirely unreachable there.
adminRouter.use(blockAdminInProduction);

// Internal receiver for staging -> production content pushes. Service-to-service
// auth via shared secret, not requireAdmin/JWT.
adminRouter.use("/sync", requireSyncSecret, syncRouter);

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
adminRouter.get("/dashboard-stats", asyncHandler(getDashboardStats));
adminRouter.post("/sync-all", asyncHandler(syncAllToProduction));

adminRouter.get("/blog", asyncHandler(listAllBlogPosts));
adminRouter.get("/blog/:id", asyncHandler(getBlogPostById));
adminRouter.post("/blog", asyncHandler(createBlogPost));
adminRouter.put("/blog/:id", asyncHandler(updateBlogPost));
adminRouter.patch("/blog/:id/autosave", asyncHandler(autosaveBlogPost));
adminRouter.delete("/blog/:id", asyncHandler(deleteBlogPost));

adminRouter.get("/blog/:id/revisions", asyncHandler(listRevisions));
adminRouter.post("/blog/:id/revisions/:revisionId/restore", asyncHandler(restoreRevision));
adminRouter.post("/blog/:id/push", asyncHandler(pushBlogPost));

adminRouter.get("/categories", asyncHandler(listCategories));
adminRouter.post("/categories", asyncHandler(createCategory));
adminRouter.put("/categories/:id", asyncHandler(updateCategory));
adminRouter.delete("/categories/:id", asyncHandler(deleteCategory));

adminRouter.get("/case-studies", asyncHandler(listAllCaseStudies));
adminRouter.get("/case-studies/:id", asyncHandler(getCaseStudyById));
adminRouter.post("/case-studies", asyncHandler(createCaseStudy));
adminRouter.put("/case-studies/:id", asyncHandler(updateCaseStudy));
adminRouter.delete("/case-studies/:id", asyncHandler(deleteCaseStudy));
adminRouter.post("/case-studies/:id/push", asyncHandler(pushCaseStudy));

adminRouter.get("/media", asyncHandler(listMedia));
adminRouter.post("/media", upload.single("file"), asyncHandler(uploadMedia));
adminRouter.post("/media/bulk", upload.array("files", 20), asyncHandler(uploadMediaBulk));
adminRouter.patch("/media/:id", asyncHandler(updateMedia));
adminRouter.delete("/media/:id", asyncHandler(deleteMedia));
