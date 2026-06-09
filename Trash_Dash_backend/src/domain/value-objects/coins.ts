export function normalizeCoins(coins: number) {
  return Math.max(0, Math.floor(coins));
}

export function canAfford(currentCoins: number, cost: number) {
  return normalizeCoins(currentCoins) >= normalizeCoins(cost);
}
