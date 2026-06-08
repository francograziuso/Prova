import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(120)
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(120)
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await container.auth.register(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await container.auth.login(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
