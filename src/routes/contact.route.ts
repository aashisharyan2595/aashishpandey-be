import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitContact } from "../controllers/contact.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

contactRouter.post("/", contactLimiter, asyncHandler(submitContact));
