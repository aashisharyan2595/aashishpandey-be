import { Request, Response } from "express";
import { ProjectModel } from "../models/Project";

export async function listProjects(_req: Request, res: Response) {
  const projects = await ProjectModel.find().sort({ order: 1 });
  return res.json(projects);
}

export async function getProjectBySlug(req: Request, res: Response) {
  const project = await ProjectModel.findOne({ slug: req.params.slug });
  if (!project) return res.status(404).json({ error: "Not found" });
  return res.json(project);
}
