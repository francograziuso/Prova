import type { Difficulty, GameSubmitInput, GameStatus } from "../../../domain/entities/types";
import type { GameRepository } from "../../../domain/repositories/GameRepository";
import type { UserRepository } from "../../../domain/repositories/UserRepository";

const coinRewardCaps: Record<Difficulty, number> = { Facile: 5, Medio: 20, Difficile: 35 };

export function calculateCoinsEarned(status: GameStatus, score: number, difficulty: Difficulty) {
  if (status !== "WIN") return 0;
  const cap = coinRewardCaps[difficulty] ?? coinRewardCaps.Facile;
  return Math.min(cap, Math.max(0, Math.floor(Math.max(0, score) / 4)));
}

export function createGameUseCases(games: GameRepository, users: UserRepository) {
  return {
    async submit(input: GameSubmitInput) {
      const coinsEarned = calculateCoinsEarned(input.status, input.score, input.difficulty);
      const game = await games.create({ ...input, coinsEarned });

      const user = input.userId
        ? await users.incrementStats(input.userId, { coins: coinsEarned, score: input.score })
        : null;

      return { game, user };
    },

    async mine(userId: number) {
      const items = await games.findRecentByUserId(userId, 50);
      return { items };
    }
  };
}
