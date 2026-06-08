export type Difficulty = "Facile" | "Medio" | "Difficile";
export type GameMode = "SINGLE" | "BATTLE";
export type GameStatus = "WIN" | "LOSE" | "ABANDONED";
export type LobbyStatus = "WAITING" | "READY" | "IN_PROGRESS" | "FINISHED" | "EXPIRED";

export type AuthenticatedUser = {
  id: number;
  email: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  coins: number;
  totalScore: number;
  settings: unknown;
  purchases: unknown[];
};

export type PublicLeaderboardUser = {
  id: number;
  username: string;
  totalScore: number;
  coins: number;
};

export type GameSubmitInput = {
  userId?: number;
  mode: GameMode;
  difficulty: Difficulty;
  score: number;
  status: GameStatus;
  livesRemaining?: number;
  durationSeconds?: number;
  errors: unknown;
  region?: string;
  capitalCity?: string;
};

export type SettingsInput = {
  music?: boolean;
  sfx?: boolean;
  localization?: boolean;
  locationPromptSeen?: boolean;
  language?: "IT" | "EN";
  equippedItemId?: string;
};

export type ReverseGeocodeResult = {
  countryCode: string | null;
  region: string;
  capitalCity: string;
  city: string | null;
};
