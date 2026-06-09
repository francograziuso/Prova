import type { Difficulty, LobbyRecord } from "../entities/types";

export interface LobbyRepository {
  findByCode(code: string): Promise<LobbyRecord | null>;
  existsByCode(code: string): Promise<boolean>;
  create(input: { code: string; hostId: number; difficulty: Difficulty; expiresAt: Date }): Promise<LobbyRecord>;
  markExpired(code: string): Promise<LobbyRecord>;
  join(input: { code: string; guestId: number }): Promise<number>;
  start(code: string): Promise<LobbyRecord>;
  updateScore(input: { code: string; userId: number; score: number }): Promise<LobbyRecord | null>;
  recordScoreAndMaybeFinish(input: { code: string; userId: number; score: number }): Promise<LobbyRecord | null>;
  finish(input: { code: string; winnerId: number | null }): Promise<LobbyRecord>;
}
