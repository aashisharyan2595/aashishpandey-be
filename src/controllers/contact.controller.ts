import { Request, Response } from "express";
import { z } from "zod";
import { SubmissionModel } from "../models/Submission";
import { sendContactEmail } from "../services/email.service";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

export async function submitContact(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    await SubmissionModel.create(parsed.data);
  } catch (err) {
    console.error("Failed to store submission", err);
  }

  await sendContactEmail(parsed.data);
  return res.status(200).json({ ok: true });
}
