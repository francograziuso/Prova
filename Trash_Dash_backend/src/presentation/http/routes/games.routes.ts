import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";
import { optionalAuth, requireAuth } from "../middleware/auth";
import type { GameErrorReport } from "../../../domain/entities/types";

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

gamesRouter.post("/submit", optionalAuth, async (req, res, next) => {
  try {
    const input = submitSchema.parse(req.body);
    const errors = Array.isArray(input.errors) ? (input.errors as GameErrorReport) : [];
    const result = await container.games.submit({ ...input, errors, userId: req.user?.id });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

gamesRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(await container.games.mine(req.user!.id));
  } catch (error) {
    next(error);
  }
});
