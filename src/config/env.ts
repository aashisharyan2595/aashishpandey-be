import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),
  mongoUri: process.env.MONGODB_URI ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  contactToEmail: process.env.CONTACT_TO_EMAIL ?? "",
  contactFromEmail: process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev",
  // Brevo SMTP relay (nodemailer) — the preferred sender. Sends through
  // Brevo's servers, touches no DNS on the primary domain (only the sender
  // identity needs a one-click email verification in the Brevo dashboard).
  // BREVO_SMTP_KEY is the SMTP key from Brevo's SMTP & API settings, not
  // the account login password.
  brevoSmtpUser: process.env.BREVO_SMTP_USER ?? "",
  brevoSmtpKey: process.env.BREVO_SMTP_KEY ?? "",
  brevoFromEmail: process.env.BREVO_FROM_EMAIL ?? process.env.BREVO_SMTP_USER ?? "",
  // Gmail SMTP (nodemailer) — secondary fallback if Brevo isn't configured.
  // GMAIL_APP_PASSWORD is a Google Account App Password, not the account
  // login password (Google has been restricting these, so Brevo is
  // preferred — see above).
  gmailUser: process.env.GMAIL_USER ?? "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? "dev-only-insecure-secret",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  bootstrapSecret: process.env.BOOTSTRAP_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/api/admin/auth/google/callback",
  // "staging" | "production" — explicit identity, NOT derived from NODE_ENV
  // (Render sets NODE_ENV=production on both the Staging and Production services).
  deployEnv: process.env.DEPLOY_ENV ?? "staging",
  contentSyncSecret: process.env.CONTENT_SYNC_SECRET ?? "",
  // Only set on the staging service — the base URL of the production backend to push content to.
  productionApiUrl: process.env.PRODUCTION_API_URL ?? "",
};
