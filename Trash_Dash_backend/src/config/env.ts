import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.string().default("*"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  LOBBY_TTL_MINUTES: z.coerce.number().default(20)
});

export const env = schema.parse(process.env);
