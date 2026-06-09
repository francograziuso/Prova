export function normalizeScore(score: number) {
  return Math.max(0, Math.floor(score));
}

export function addScore(currentScore: number, scoreToAdd: number) {
  return normalizeScore(currentScore) + normalizeScore(scoreToAdd);
}
