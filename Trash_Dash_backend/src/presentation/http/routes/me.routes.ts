import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../../../infrastructure/prisma/client";
import { HttpError } from "../../../utils/http";

export const meRouter = Router();

const settingsSchema = z.object({
  music: z.boolean().optional(),
  sfx: z.boolean().optional(),
  localization: z.boolean().optional(),
  locationPromptSeen: z.boolean().optional(),
  language: z.enum(["IT", "EN", "Italiano", "English"]).optional(),
  equippedItemId: z.string().optional()
});

function normalizeUser(user: any) {
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

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { settings: true, purchases: true }
    });
    if (!user) throw new HttpError(404, "Utente non trovato");
    res.json({ user: normalizeUser(user) });
  } catch (error) {
    next(error);
  }
});

meRouter.put("/settings", requireAuth, async (req, res, next) => {
  try {
    const input = settingsSchema.parse(req.body);
    const language = input.language ? (input.language === "English" ? "EN" : input.language === "Italiano" ? "IT" : input.language) : undefined;

    const settings = await prisma.setting.upsert({
      where: { userId: req.user!.id },
      update: { ...input, language },
      create: { userId: req.user!.id, ...input, language }
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});
