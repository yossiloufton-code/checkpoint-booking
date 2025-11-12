import express from "express";
import helmet from "helmet";
import cors from "cors";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { httpLogger } from "./middleware/logger";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { AppDataSource } from "./config/data-source";


export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(httpLogger);

  app.get("/healthz", (_req, res) => res.status(200).send("ok"));

  app.get("/readyz", async (_req, res) => {
    try {
      await AppDataSource.query("SELECT 1");
      res.status(200).send("ready");
    } catch (err) {
      res.status(500).send("not-ready");
    }
  });

  // Baseline limiter for all API routes
  app.use("/api", apiRateLimiter);

  app.use(express.json());

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
