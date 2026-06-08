import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env";
import { router } from "./presentation/http/routes";
import { errorHandler, notFound } from "./presentation/http/middleware/error";

const allowedOrigins = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((item) => item.trim());

export const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "trashdash-backend", timestamp: new Date().toISOString() });
});

app.use("/api", router);
app.use(notFound);
app.use(errorHandler);
