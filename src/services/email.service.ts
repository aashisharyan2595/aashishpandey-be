import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

// Explicit, short timeouts — nodemailer's defaults (2 minutes) mean a
// blocked/unreachable SMTP host hangs far longer than any caller should
// ever wait. sendEmail() is fire-and-forget from the contact endpoint, but
// a fast, logged failure still matters far more than a silent multi-minute
// stall.
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 };

const brevoTransport =
  env.brevoSmtpUser && env.brevoSmtpKey
    ? nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: { user: env.brevoSmtpUser, pass: env.brevoSmtpKey },
        ...SMTP_TIMEOUTS,
      })
    : null;

const gmailTransport =
  env.gmailUser && env.gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: env.gmailUser, pass: env.gmailAppPassword },
        ...SMTP_TIMEOUTS,
      })
    : null;

// Brevo SMTP relay is preferred — a verified single-sender identity (one
// email-click confirmation, no DNS) sending through Brevo's own servers.
// Gmail SMTP (App Password) is a secondary fallback, since Google has been
// restricting App Password availability. Resend is the last resort, for
// accounts that do want a Resend-verified sending domain.
async function sendEmail(params: { to: string; replyTo?: string; subject: string; text: string }): Promise<void> {
  if (brevoTransport) {
    await brevoTransport.sendMail({
      from: `"Aashish Pandey — Portfolio" <${env.brevoFromEmail}>`,
      to: params.to,
      replyTo: params.replyTo,
      subject: params.subject,
      text: params.text,
    });
    return;
  }

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
