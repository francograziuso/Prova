import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";
import { requireAuth } from "../middleware/auth";

export const meRouter = Router();

const settingsSchema = z.object({
  music: z.boolean().optional(),
  sfx: z.boolean().optional(),
  localization: z.boolean().optional(),
  locationPromptSeen: z.boolean().optional(),
  language: z.enum(["IT", "EN", "Italiano", "English"]).optional(),
  equippedItemId: z.string().optional()
});

meRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await container.users.getProfile(req.user!.id));
  } catch (error) {
    next(error);
  }
});

meRouter.put("/settings", requireAuth, async (req, res, next) => {
  try {
    const input = settingsSchema.parse(req.body);
    res.json(await container.users.updateSettings(req.user!.id, input));
  } catch (error) {
    next(error);
  }
});
