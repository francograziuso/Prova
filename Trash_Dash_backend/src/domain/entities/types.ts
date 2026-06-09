export type Difficulty = "Facile" | "Medio" | "Difficile";
export type GameMode = "SINGLE" | "BATTLE";
export type GameStatus = "WIN" | "LOSE" | "ABANDONED";
export type LobbyStatus = "WAITING" | "READY" | "IN_PROGRESS" | "FINISHED" | "EXPIRED";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type UserSettings = {
  music: boolean;
  sfx: boolean;
  localization: boolean;
  locationPromptSeen: boolean;
  language: "IT" | "EN";
  equippedItemId: string;
};

export type UserPurchase = {
  userId: number;
  itemId: string;
  purchasedAt: Date;
};

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
  settings: UserSettings | null;
  purchases: UserPurchase[];
};

export type PublicLeaderboardUser = {
  id: number;
  username: string;
  totalScore: number;
  coins: number;
};

export type GameErrorReportItem = {
  name?: string;
  desc?: string;
  [key: string]: JsonValue | undefined;
};

export type GameErrorReport = GameErrorReportItem[];

export type GameSubmitInput = {
  userId?: number;
  mode: GameMode;
  difficulty: Difficulty;
  score: number;
  status: GameStatus;
  livesRemaining?: number;
  durationSeconds?: number;
  errors: GameErrorReport;
  region?: string;
  capitalCity?: string;
};

export type GameRecord = {
  id: number;
  userId: number | null;
  mode: GameMode;
  difficulty: Difficulty;
  score: number;
  status: GameStatus;
  livesRemaining: number | null;
  durationSeconds: number | null;
  errors: GameErrorReport;
  coinsEarned: number;
  region: string | null;
  capitalCity: string | null;
  createdAt: Date;
};

export type ShopItem = {
  id: string;
  name: string;
  type: string;
  cost: number;
  iconHealthy: string;
  iconDead: string;
};

export type LobbyParticipant = {
  id: number;
  username: string;
};

export type LobbyRecord = {
  id?: number;
  code: string;
  hostId: number;
  guestId: number | null;
  difficulty: Difficulty;
  status: LobbyStatus;
  hostScore: number | null;
  guestScore: number | null;
  winnerId: number | null;
  expiresAt: Date;
  createdAt?: Date;
  host?: LobbyParticipant;
  guest?: LobbyParticipant | null;
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
