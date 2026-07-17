import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { revokeAllSessions } from "../services/session.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await UserModel.find()
    .select("name email status lastLoginAt createdAt googleId passwordHash")
    .sort({ createdAt: -1 });

  return res.json(
    users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.get("createdAt"),
      hasGoogle: Boolean(u.googleId),
      hasPassword: Boolean(u.passwordHash),
    }))
  );
}

export async function approveUser(req: Request, res: Response) {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });

  user.status = "approved";
  await user.save();
  return res.json({ id: user._id, status: user.status });
}

export async function rejectUser(req: Request, res: Response) {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });

  user.status = "rejected";
  await user.save();
  await revokeAllSessions(String(user._id));
  return res.json({ id: user._id, status: user.status });
}

export async function deleteUser(req: Request, res: Response) {
  if (req.adminUser && String(req.adminUser._id) === req.params.id) {
    return res.status(400).json({ error: "You can't remove your own account" });
  }

  const deleted = await UserModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });

  await revokeAllSessions(String(deleted._id));
  return res.status(204).send();
}
