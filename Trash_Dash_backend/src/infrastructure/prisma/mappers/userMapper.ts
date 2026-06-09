import type { UserProfile, UserPurchase, UserSettings } from "../../../domain/entities/types";

type RawSettings = Omit<UserSettings, "language"> & {
  language: string;
  userId?: number;
};

type ProfileLike = {
  id: number;
  username: string;
  email: string;
  coins: number;
  totalScore: number;
  settings?: RawSettings | UserSettings | null;
  purchases?: UserPurchase[];
};

export function toUserSettings(settings: RawSettings | UserSettings): UserSettings {
  return {
    music: settings.music,
    sfx: settings.sfx,
    localization: settings.localization,
    locationPromptSeen: settings.locationPromptSeen,
    language: settings.language === "EN" ? "EN" : "IT",
    equippedItemId: settings.equippedItemId
  };
}

export function toUserProfile(user: ProfileLike): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    coins: user.coins,
    totalScore: user.totalScore,
    settings: user.settings ? toUserSettings(user.settings) : null,
    purchases: user.purchases ?? []
  };
}
