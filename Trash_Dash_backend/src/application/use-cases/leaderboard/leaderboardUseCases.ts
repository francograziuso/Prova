import type { LeaderboardRepository } from "../../../domain/repositories/LeaderboardRepository";

const ADMIN_TEST_EMAIL = "admin@admin.admin";

export function createLeaderboardUseCases(leaderboard: LeaderboardRepository) {
  return {
    async list(input: { limit: number; guestScore?: number }) {
      const users = await leaderboard.findTopUsers({ limit: input.limit, excludedEmail: ADMIN_TEST_EMAIL });
      const guestPosition = input.guestScore && input.guestScore > 0
        ? (await leaderboard.countUsersAtOrAboveScore({
            score: input.guestScore,
            excludedEmail: ADMIN_TEST_EMAIL
          })) + 1
        : null;

      return {
        items: users.map((user, index) => ({
          position: index + 1,
          userId: user.id,
          username: user.username,
          score: user.totalScore,
          coins: user.coins
        })),
        guestPosition
      };
    }
  };
}
