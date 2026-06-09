import type { SettingsInput, UserProfile, UserSettings } from "../entities/types";

export interface UserRepository {
  findByEmailOrUsername(email: string, username: string): Promise<UserProfile | null>;
  findByEmailWithPassword(email: string): Promise<(UserProfile & { passwordHash: string }) | null>;
  createRegisteredUser(input: { username: string; email: string; passwordHash: string }): Promise<UserProfile>;
  findProfileById(userId: number): Promise<UserProfile | null>;
  updateSettings(userId: number, input: SettingsInput): Promise<UserSettings>;
  incrementStats(userId: number, input: { coins: number; score: number }): Promise<UserProfile>;
}
