import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(10),
      guestScore: z.coerce.number().int().min(0).optional()
    }).parse(req.query);

    res.json(await container.leaderboard.list(query));
  } catch (error) {
    next(error);
  }
});
