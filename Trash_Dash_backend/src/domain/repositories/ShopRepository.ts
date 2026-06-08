import type { UserProfile } from "../entities/types";

export interface ShopRepository {
  findItems(): Promise<unknown[]>;
  findItem(itemId: string): Promise<{ id: string; cost: number } | null>;
  hasPurchase(userId: number, itemId: string): Promise<boolean>;
  findUserProfile(userId: number): Promise<UserProfile | null>;
  buyItem(input: { userId: number; itemId: string; cost: number }): Promise<UserProfile>;
  equipItem(input: { userId: number; itemId: string }): Promise<UserProfile | null>;
}
