import type { GameErrorReport, GameRecord, GameSubmitInput } from "../../../domain/entities/types";
import type { GameRepository } from "../../../domain/repositories/GameRepository";
import type { PrismaClientLike } from "../PrismaClientLike";

export class PrismaGameRepository implements GameRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  private toGameRecord(game: Omit<GameRecord, "errors"> & { errors: unknown }): GameRecord {
    return { ...game, errors: game.errors as GameErrorReport };
  }

  async create(input: GameSubmitInput & { coinsEarned: number }) {
    const game = await this.prisma.game.create({
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
    return this.toGameRecord(game);
  }

  async findRecentByUserId(userId: number, limit: number) {
    const games = await this.prisma.game.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return games.map((game) => this.toGameRecord(game));
  }
}
