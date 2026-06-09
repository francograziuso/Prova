import { canAfford } from "./coins";

export type PurchasePolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: "INSUFFICIENT_COINS" };

export function canPurchaseItem(input: { currentCoins: number; cost: number }): PurchasePolicyDecision {
  if (!canAfford(input.currentCoins, input.cost)) return { allowed: false, reason: "INSUFFICIENT_COINS" };
  return { allowed: true };
}
