import { Request, Response } from "express";
import { z } from "zod";
import { CategoryModel } from "../models/Category";

export async function listCategories(_req: Request, res: Response) {
  const categories = await CategoryModel.find().sort({ name: 1 });
  return res.json(categories);
}

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
});

export async function createCategory(req: Request, res: Response) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const exists = await CategoryModel.findOne({ slug: parsed.data.slug });
  if (exists) return res.status(409).json({ error: "Slug already in use" });

  const category = await CategoryModel.create(parsed.data);
  return res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response) {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const category = await CategoryModel.findById(req.params.id);
  if (!category) return res.status(404).json({ error: "Not found" });

  Object.assign(category, parsed.data);
  await category.save();
  return res.json(category);
}

export async function deleteCategory(req: Request, res: Response) {
  const deleted = await CategoryModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
}
