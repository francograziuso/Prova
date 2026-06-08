import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../../infrastructure/prisma/client";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", async (req, res, next) => {
  try {
    const query = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(10),
      guestScore: z.coerce.number().int().min(0).optional()
    }).parse(req.query);

    const users = await prisma.user.findMany({
      orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      take: query.limit,
      select: { id: true, username: true, totalScore: true, coins: true }
    });

    const guestPosition = query.guestScore && query.guestScore > 0
      ? (await prisma.user.count({ where: { totalScore: { gte: query.guestScore } } })) + 1
      : null;

    res.json({
      items: users.map((user, index) => ({
        position: index + 1,
        userId: user.id,
        username: user.username,
        score: user.totalScore,
        coins: user.coins
      })),
      guestPosition
    });
  } catch (error) {
    next(error);
  }
});
