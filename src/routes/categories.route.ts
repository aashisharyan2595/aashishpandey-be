import { Router } from "express";
import { listCategories } from "../controllers/category.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(listCategories));
