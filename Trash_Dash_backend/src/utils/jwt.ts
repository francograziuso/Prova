import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AuthPayload = { userId: number; email: string };

export const signToken = (payload: AuthPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AuthPayload;
