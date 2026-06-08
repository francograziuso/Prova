import type { SettingsInput, UserProfile } from "../entities/types";

export interface UserRepository {
  findByEmailOrUsername(email: string, username: string): Promise<unknown | null>;
  findByEmailWithPassword(email: string): Promise<(UserProfile & { passwordHash: string }) | null>;
  createRegisteredUser(input: { username: string; email: string; passwordHash: string }): Promise<UserProfile>;
  findProfileById(userId: number): Promise<UserProfile | null>;
  updateSettings(userId: number, input: SettingsInput): Promise<unknown>;
  incrementStats(userId: number, input: { coins: number; score: number }): Promise<UserProfile>;
}
