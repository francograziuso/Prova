import type { GameSubmitInput } from "../entities/types";

export interface GameRepository {
  create(input: GameSubmitInput & { coinsEarned: number }): Promise<unknown>;
  findRecentByUserId(userId: number, limit: number): Promise<unknown[]>;
}
