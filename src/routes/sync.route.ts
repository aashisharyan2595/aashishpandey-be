import { Router } from "express";
import {
  receiveBlogPostPush,
  receiveCaseStudyPush,
  reconcileBlogPosts,
  reconcileCaseStudies,
  reconcileCategories,
  reconcileMedia,
} from "../controllers/sync-receiver.controller";
import { asyncHandler } from "../middleware/asyncHandler";

// Mounted at /api/admin/sync, behind requireSyncSecret only (no requireAdmin
// — this is the receiver side, called by the staging backend, not a browser).
export const syncRouter = Router();

syncRouter.post("/blog/push", asyncHandler(receiveBlogPostPush));
syncRouter.post("/case-studies/push", asyncHandler(receiveCaseStudyPush));
syncRouter.post("/blog/reconcile", asyncHandler(reconcileBlogPosts));
syncRouter.post("/case-studies/reconcile", asyncHandler(reconcileCaseStudies));
syncRouter.post("/categories/reconcile", asyncHandler(reconcileCategories));
syncRouter.post("/media/reconcile", asyncHandler(reconcileMedia));
