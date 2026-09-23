import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const gmailTransport =
  env.gmailUser && env.gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: env.gmailUser, pass: env.gmailAppPassword },
      })
    : null;

// Gmail SMTP is preferred when configured — it sends through Gmail's own
// servers and touches nothing on the primary domain's DNS, which matters
// when that domain's mail (e.g. Outlook/M365) is managed elsewhere and a
// Resend-verified sending domain isn't wanted. Resend remains a fallback
// for accounts that do want it.
async function sendEmail(params: { to: string; replyTo?: string; subject: string; text: string }): Promise<void> {
  if (gmailTransport) {
    await gmailTransport.sendMail({
      from: `"Aashish Pandey — Portfolio" <${env.gmailUser}>`,
      to: params.to,
      replyTo: params.replyTo,
      subject: params.subject,
      text: params.text,
    });
    return;
  }

  if (resend && env.contactToEmail) {
    await resend.emails.send({
      from: env.contactFromEmail,
      to: params.to,
      replyTo: params.replyTo,
      subject: params.subject,
      text: params.text,
    });
    return;
  }

  console.log("Email not sent (no sender configured):", params);
}

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
  if (!env.contactToEmail) {
    console.log("Contact form submission (CONTACT_TO_EMAIL not set):", params);
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

  await sendEmail({
    to: env.contactToEmail,
    replyTo: params.email,
    subject: `New portfolio contact from ${params.name}`,
    text: `From: ${params.name} <${params.email}>${context ? `\n${context}` : ""}\n\n${params.message}`,
  });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
  await sendEmail({
    to: params.to,
    subject: "Reset your admin password",
    text: `Reset your password using this link (valid for 1 hour):\n\n${params.resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
  });
}
