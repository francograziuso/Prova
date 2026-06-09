import type { GameRepository } from "../../domain/repositories/GameRepository";
import type { LobbyRepository } from "../../domain/repositories/LobbyRepository";
import type { ShopRepository } from "../../domain/repositories/ShopRepository";
import type { UserRepository } from "../../domain/repositories/UserRepository";

export type TransactionalRepositories = {
  games: GameRepository;
  lobbies: LobbyRepository;
  shop: ShopRepository;
  users: UserRepository;
};

export interface TransactionManager {
  run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T>;
}

export function createPassthroughTransactionManager(repositories: Partial<TransactionalRepositories>): TransactionManager {
  return {
    run: (work) => work(repositories as TransactionalRepositories)
  };
}
