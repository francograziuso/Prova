import type { UserProfile } from "../../../domain/entities/types";

type ProfileLike = {
  id: number;
  username: string;
  email: string;
  coins: number;
  totalScore: number;
  settings?: unknown;
  purchases?: unknown[];
};

export function toUserProfile(user: ProfileLike): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    coins: user.coins,
    totalScore: user.totalScore,
    settings: user.settings ?? null,
    purchases: user.purchases ?? []
  };
}
