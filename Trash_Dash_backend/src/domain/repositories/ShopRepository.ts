import type { ShopItem, UserProfile } from "../entities/types";

export type BuyItemResult =
  | { status: "already-owned"; user: UserProfile | null }
  | { status: "purchased"; user: UserProfile };

export interface ShopRepository {
  findItems(): Promise<ShopItem[]>;
  findItem(itemId: string): Promise<ShopItem | null>;
  hasPurchase(userId: number, itemId: string): Promise<boolean>;
  findUserProfile(userId: number): Promise<UserProfile | null>;
  buyItem(input: { userId: number; itemId: string; cost: number }): Promise<BuyItemResult>;
  equipItem(input: { userId: number; itemId: string }): Promise<UserProfile | null>;
}
