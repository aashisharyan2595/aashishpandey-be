import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const INQUIRY_LABELS: Record<string, string> = {
  general: "Just saying hi",
  recruiter: "Hiring (recruiter)",
  project: "Project or freelance work",
};

export async function sendContactEmail(params: {
  name: string;
  email: string;
  message: string;
  inquiryType?: string;
  company?: string;
  role?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
}): Promise<void> {
  if (!resend || !env.contactToEmail) {
    console.log("Contact form submission (email not configured):", params);
    return;
  }

  const context = [
    params.inquiryType && `Reaching out as: ${INQUIRY_LABELS[params.inquiryType] ?? params.inquiryType}`,
    params.company && `Company: ${params.company}`,
    params.role && `Role: ${params.role}`,
    params.projectType && `Project type: ${params.projectType}`,
    params.budget && `Budget: ${params.budget}`,
    params.timeline && `Timeline: ${params.timeline}`,
  ]
    .filter(Boolean)
    .join("\n");

  await resend.emails.send({
    from: env.contactFromEmail,
    to: env.contactToEmail,
    replyTo: params.email,
    subject: `New portfolio contact from ${params.name}`,
    text: `From: ${params.name} <${params.email}>${context ? `\n${context}` : ""}\n\n${params.message}`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  if (!resend) {
    console.log("Password reset link (email not configured):", params.resetUrl);
    return;
  }

  await resend.emails.send({
    from: env.contactFromEmail,
    to: params.to,
    subject: "Reset your admin password",
    text: `Reset your password using this link (valid for 1 hour):\n\n${params.resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
  });
}
