import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../../infrastructure/prisma/client";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(10) }).parse(req.query);
    const users = await prisma.user.findMany({
      orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      take: query.limit,
      select: { id: true, username: true, totalScore: true, coins: true }
    });

    res.json({
      items: users.map((user, index) => ({
        position: index + 1,
        userId: user.id,
        username: user.username,
        score: user.totalScore,
        coins: user.coins
      }))
    });
  } catch (error) {
    next(error);
  }
});
