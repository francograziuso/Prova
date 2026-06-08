import type { PrismaClient } from "@prisma/client";
import type { LeaderboardRepository } from "../../../domain/repositories/LeaderboardRepository";

export class PrismaLeaderboardRepository implements LeaderboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findTopUsers(input: { limit: number; excludedEmail: string }) {
    return this.prisma.user.findMany({
      where: { email: { not: input.excludedEmail } },
      orderBy: [{ totalScore: "desc" }, { createdAt: "asc" }],
      take: input.limit,
      select: { id: true, username: true, totalScore: true, coins: true }
    });
  }

  countUsersAtOrAboveScore(input: { score: number; excludedEmail: string }) {
    return this.prisma.user.count({
      where: {
        email: { not: input.excludedEmail },
        totalScore: { gte: input.score }
      }
    });
  }
}
