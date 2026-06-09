import type { Difficulty, GameStatus } from "../entities/types";
import { normalizeScore } from "./score";

const coinRewardCaps: Record<Difficulty, number> = { Facile: 5, Medio: 20, Difficile: 35 };

export function calculateCoinsEarned(status: GameStatus, score: number, difficulty: Difficulty) {
  if (status !== "WIN") return 0;
  const cap = coinRewardCaps[difficulty] ?? coinRewardCaps.Facile;
  return Math.min(cap, Math.floor(normalizeScore(score) / 4));
}

export function determineBattleWinner(input: {
  hostId: number;
  guestId: number | null;
  hostScore: number;
  guestScore: number;
}) {
  if (input.hostScore === input.guestScore) return null;
  return input.hostScore > input.guestScore ? input.hostId : input.guestId;
}
