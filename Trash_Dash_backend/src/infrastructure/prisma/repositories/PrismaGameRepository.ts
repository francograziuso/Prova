import type { PrismaClient } from "@prisma/client";
import type { GameSubmitInput } from "../../../domain/entities/types";
import type { GameRepository } from "../../../domain/repositories/GameRepository";

export class PrismaGameRepository implements GameRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: GameSubmitInput & { coinsEarned: number }) {
    return this.prisma.game.create({
      data: {
        userId: input.userId,
        mode: input.mode,
        difficulty: input.difficulty,
        score: input.score,
        status: input.status,
        livesRemaining: input.livesRemaining,
        durationSeconds: input.durationSeconds,
        errors: input.errors as never,
        coinsEarned: input.coinsEarned,
        region: input.region,
        capitalCity: input.capitalCity
      }
    });
  }

  findRecentByUserId(userId: number, limit: number) {
    return this.prisma.game.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }
}
