import type { PublicLeaderboardUser } from "../entities/types";

export interface LeaderboardRepository {
  findTopUsers(input: { limit: number; excludedEmail: string }): Promise<PublicLeaderboardUser[]>;
  countUsersAtOrAboveScore(input: { score: number; excludedEmail: string }): Promise<number>;
}
