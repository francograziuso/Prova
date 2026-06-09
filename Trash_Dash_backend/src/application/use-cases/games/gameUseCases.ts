import type { GameSubmitInput } from "../../../domain/entities/types";
import type { GameRepository } from "../../../domain/repositories/GameRepository";
import type { UserRepository } from "../../../domain/repositories/UserRepository";
import { calculateCoinsEarned } from "../../../domain/value-objects/gameResult";
import { createPassthroughTransactionManager, type TransactionManager } from "../../ports/TransactionManager";

export { calculateCoinsEarned };

export function createGameUseCases(games: GameRepository, users: UserRepository, transactions?: TransactionManager) {
  const transactionManager = transactions ?? createPassthroughTransactionManager({ games, users });

  return {
    async submit(input: GameSubmitInput) {
      const coinsEarned = calculateCoinsEarned(input.status, input.score, input.difficulty);

      return transactionManager.run(async (repositories) => {
        const game = await repositories.games.create({ ...input, coinsEarned });
        const user = input.userId
          ? await repositories.users.incrementStats(input.userId, { coins: coinsEarned, score: input.score })
          : null;

        return { game, user };
      });
    },

    async mine(userId: number) {
      const items = await games.findRecentByUserId(userId, 50);
      return { items };
    }
  };
}
