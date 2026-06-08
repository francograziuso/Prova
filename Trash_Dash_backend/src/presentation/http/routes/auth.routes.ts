import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../../infrastructure/prisma/client";
import { HttpError } from "../../../utils/http";
import { signToken } from "../../../utils/jwt";
import { hashPassword, verifyPassword } from "../../../utils/password";

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

function publicUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    coins: user.coins,
    totalScore: user.totalScore,
    settings: user.settings,
    purchases: user.purchases ?? []
  };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email.toLowerCase() }, { username: input.username }] }
    });

    if (existing) throw new HttpError(409, "Email o username già registrati");

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email.toLowerCase(),
        passwordHash,
        coins: 0,
        totalScore: 0,
        settings: { create: { localization: false, locationPromptSeen: false } },
        purchases: { create: { itemId: "tree_green" } }
      },
      include: { settings: true, purchases: true }
    });

    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { settings: true, purchases: true }
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new HttpError(401, "Credenziali non valide");
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});
