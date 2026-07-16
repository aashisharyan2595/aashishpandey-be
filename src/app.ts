import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { blogRouter } from "./routes/blog.route";
import { contactRouter } from "./routes/contact.route";
import { healthRouter } from "./routes/health.route";
import { projectsRouter } from "./routes/projects.route";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/contact", contactRouter);
app.use("/api/blog", blogRouter);
app.use("/api/projects", projectsRouter);

app.use(errorHandler);
