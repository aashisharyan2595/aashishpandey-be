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
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? "dev-only-insecure-secret",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
};
