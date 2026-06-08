import { Router } from "express";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { prisma } from "../../../infrastructure/prisma/client";

export const gamesRouter = Router();

const submitSchema = z.object({
  mode: z.enum(["SINGLE", "BATTLE"]).default("SINGLE"),
  difficulty: z.enum(["Facile", "Medio", "Difficile"]),
  score: z.number().int().min(0),
  status: z.enum(["WIN", "LOSE", "ABANDONED"]),
  livesRemaining: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  errors: z.unknown().default([]),
  region: z.string().optional(),
  capitalCity: z.string().optional()
});

const coinRewardCaps = { Facile: 5, Medio: 20, Difficile: 35 } as const;

function calculateCoinsEarned(status: "WIN" | "LOSE" | "ABANDONED", score: number, difficulty: keyof typeof coinRewardCaps) {
  if (status !== "WIN") return 0;
  const cap = coinRewardCaps[difficulty] ?? coinRewardCaps.Facile;
  return Math.min(cap, Math.max(0, Math.floor(Math.max(0, score) / 4)));
}

gamesRouter.post("/submit", optionalAuth, async (req, res, next) => {
  try {
    const input = submitSchema.parse(req.body);
    const coinsEarned = calculateCoinsEarned(input.status, input.score, input.difficulty);

    const game = await prisma.game.create({
      data: {
        userId: req.user?.id,
        mode: input.mode,
        difficulty: input.difficulty,
        score: input.score,
        status: input.status,
        livesRemaining: input.livesRemaining,
        durationSeconds: input.durationSeconds,
        errors: input.errors as any,
        coinsEarned,
        region: input.region,
        capitalCity: input.capitalCity
      }
    });

    let user = null;
    if (req.user?.id) {
      user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          coins: { increment: coinsEarned },
          totalScore: { increment: input.score }
        },
        include: { settings: true, purchases: true }
      });
    }

    res.status(201).json({ game, user });
  } catch (error) {
    next(error);
  }
});

gamesRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.game.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});
