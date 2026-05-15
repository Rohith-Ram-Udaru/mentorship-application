import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { pairingRoutes } from "./routes/pairingRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 400 }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, name: "MENTORFLOW X" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/pairings", pairingRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
