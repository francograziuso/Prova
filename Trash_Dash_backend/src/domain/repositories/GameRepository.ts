import type { GameRecord, GameSubmitInput } from "../entities/types";

export interface GameRepository {
  create(input: GameSubmitInput & { coinsEarned: number }): Promise<GameRecord>;
  findRecentByUserId(userId: number, limit: number): Promise<GameRecord[]>;
}
