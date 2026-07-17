import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin.route";
import { blogRouter } from "./routes/blog.route";
import { categoriesRouter } from "./routes/categories.route";
import { contactRouter } from "./routes/contact.route";
import { healthRouter } from "./routes/health.route";
import { projectsRouter } from "./routes/projects.route";

export const app = express();

// Render (and most PaaS hosts) put the app behind a single reverse proxy hop,
// which sets X-Forwarded-For. Without this, express-rate-limit throws on every
// rate-limited request instead of keying off the real client IP.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/contact", contactRouter);
app.use("/api/blog", blogRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);
