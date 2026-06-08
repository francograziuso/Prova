import type { Difficulty } from "../entities/types";

export interface LobbyRepository {
  findByCode(code: string): Promise<unknown | null>;
  existsByCode(code: string): Promise<boolean>;
  create(input: { code: string; hostId: number; difficulty: Difficulty; expiresAt: Date }): Promise<unknown>;
  markExpired(code: string): Promise<unknown>;
  join(input: { code: string; guestId: number }): Promise<number>;
  start(code: string): Promise<unknown>;
  updateScore(input: { code: string; userId: number; score: number }): Promise<unknown | null>;
  finish(input: { code: string; winnerId: number | null }): Promise<unknown>;
}
