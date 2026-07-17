import { Request, Response } from "express";
import { z } from "zod";
import { CaseStudyModel } from "../models/CaseStudy";

const caseStudySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  client: z.string().min(1).max(200),
  timeframe: z.string().min(1).max(100),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string()).default([]),
  problem: z.string().min(1),
  approach: z.string().min(1),
  outcome: z.string().min(1),
  metric: z.object({
    value: z.string().min(1).max(50),
    label: z.string().min(1).max(200),
  }),
  coverImage: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.number().default(0),
  published: z.boolean().default(true),
});

// Public: published only, ordered for display
export async function listCaseStudies(_req: Request, res: Response) {
  const caseStudies = await CaseStudyModel.find({ published: true }).sort({
    order: 1,
    createdAt: 1,
  });
  return res.json(caseStudies);
}

export async function getCaseStudyBySlug(req: Request, res: Response) {
  const caseStudy = await CaseStudyModel.findOne({
    slug: req.params.slug,
    published: true,
  });
  if (!caseStudy) return res.status(404).json({ error: "Not found" });
  return res.json(caseStudy);
}

// Admin: everything, including drafts
export async function listAllCaseStudies(_req: Request, res: Response) {
  const caseStudies = await CaseStudyModel.find().sort({ order: 1, createdAt: 1 });
  return res.json(caseStudies);
}

export async function getCaseStudyById(req: Request, res: Response) {
  const caseStudy = await CaseStudyModel.findById(req.params.id);
  if (!caseStudy) return res.status(404).json({ error: "Not found" });
  return res.json(caseStudy);
}

export async function createCaseStudy(req: Request, res: Response) {
  const parsed = caseStudySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const exists = await CaseStudyModel.findOne({ slug: parsed.data.slug });
  if (exists) return res.status(409).json({ error: "Slug already in use" });

  const caseStudy = await CaseStudyModel.create(parsed.data);
  return res.status(201).json(caseStudy);
}

export async function updateCaseStudy(req: Request, res: Response) {
  const parsed = caseStudySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const caseStudy = await CaseStudyModel.findById(req.params.id);
  if (!caseStudy) return res.status(404).json({ error: "Not found" });

  if (parsed.data.slug && parsed.data.slug !== caseStudy.slug) {
    const exists = await CaseStudyModel.findOne({ slug: parsed.data.slug });
    if (exists) return res.status(409).json({ error: "Slug already in use" });
  }

  Object.assign(caseStudy, parsed.data);
  await caseStudy.save();
  return res.json(caseStudy);
}

export async function deleteCaseStudy(req: Request, res: Response) {
  const deleted = await CaseStudyModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
}
