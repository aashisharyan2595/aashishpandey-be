import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendContactEmail(params: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  if (!resend || !env.contactToEmail) {
    console.log("Contact form submission (email not configured):", params);
    return;
  }

  await resend.emails.send({
    from: env.contactFromEmail,
    to: env.contactToEmail,
    replyTo: params.email,
    subject: `New portfolio contact from ${params.name}`,
    text: `From: ${params.name} <${params.email}>\n\n${params.message}`,
  });
}
