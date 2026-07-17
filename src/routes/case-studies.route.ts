import { Router } from "express";
import { getCaseStudyBySlug, listCaseStudies } from "../controllers/case-study.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const caseStudiesRouter = Router();

caseStudiesRouter.get("/", asyncHandler(listCaseStudies));
caseStudiesRouter.get("/:slug", asyncHandler(getCaseStudyBySlug));
