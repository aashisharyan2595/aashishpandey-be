import { Router } from "express";
import { getProjectBySlug, listProjects } from "../controllers/projects.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const projectsRouter = Router();

projectsRouter.get("/", asyncHandler(listProjects));
projectsRouter.get("/:slug", asyncHandler(getProjectBySlug));
