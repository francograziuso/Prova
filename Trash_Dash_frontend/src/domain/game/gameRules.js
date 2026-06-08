// Domain layer: regole pure di difficolta, punteggio e spawn.
import { EASY_WASTES, MEDIUM_WASTES, HARD_WASTES } from "./wasteCatalog";

export const DIFFICULTY_SETTINGS = {
  Facile: { time: 100, lives: 3, minObjects: 5, maxObjects: 8 },
  Medio: { time: 55, lives: 3, minObjects: 8, maxObjects: 12 },
  Difficile: { time: 42, lives: 3, minObjects: 10, maxObjects: 15 },
};

export const BATTLE_DIFFICULTIES = ["Facile", "Medio", "Difficile"];
export const normalizeBattleDifficulty = (value) => (BATTLE_DIFFICULTIES.includes(value) ? value : "Medio");
export const COIN_REWARD_CAPS = { Facile: 5, Medio: 20, Difficile: 35 };
export const calculateCoinsEarned = (status, score, selectedDifficulty) => {
  if (status !== "VITTORIA" && status !== "WIN") return 0;
  const cap = COIN_REWARD_CAPS[selectedDifficulty] ?? COIN_REWARD_CAPS.Facile;
  return Math.min(cap, Math.max(0, Math.floor(Math.max(0, score) / 4)));
};

export const WASTE_POOLS = {
  Facile: EASY_WASTES,
  Medio: MEDIUM_WASTES,
  Difficile: HARD_WASTES,
};

export const METAL_WASTE_NAMES = new Set([
  "Lattina Alluminio",
  "Lattina alluminio",
  "Vaschetta alluminio",
  "Tappo corona",
  "Scatoletta tonno",
]);

export const HARD_REQUIRED_TYPES = ["carta", "multi", "umido", "vetro", "secco", "rs"];

export const BIN_DROP_CALIBRATION = {
  carta: { expandTop: 24, expandBottom: 28, expandLeft: 24, expandRight: 24, magneticRadius: 95, centerPower: 1.08 },
  multi: { expandTop: 24, expandBottom: 28, expandLeft: 24, expandRight: 24, magneticRadius: 95, centerPower: 1.08 },
  umido: { expandTop: 30, expandBottom: 36, expandLeft: 28, expandRight: 28, magneticRadius: 115, centerPower: 1.14 },
  vetro: { expandTop: 34, expandBottom: 40, expandLeft: 32, expandRight: 32, magneticRadius: 125, centerPower: 1.2 },
  secco: { expandTop: 24, expandBottom: 30, expandLeft: 24, expandRight: 24, magneticRadius: 98, centerPower: 1.05 },
  rs: { expandTop: 24, expandBottom: 30, expandLeft: 24, expandRight: 24, magneticRadius: 100, centerPower: 1.12 },
};

export const WASTE_DROP_CALIBRATION = {
  "Giornale vecchio": { anchorOffsetX: 0, anchorOffsetY: 10, probeSpreadX: 24, probeSpreadY: 20, mainWeight: 18 },
  "Bottiglia PET": { anchorOffsetX: 0, anchorOffsetY: 14, probeSpreadX: 20, probeSpreadY: 28, mainWeight: 18 },
  "Buccia di banana": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 28, probeSpreadY: 22, mainWeight: 20 },
  "Barattolo di vetro": { anchorOffsetX: 0, anchorOffsetY: 13, probeSpreadX: 26, probeSpreadY: 26, mainWeight: 22 },
  "Lattina Alluminio": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 22, probeSpreadY: 22, mainWeight: 19 },
  "Scatola Pizza": { anchorOffsetX: 0, anchorOffsetY: 12, probeSpreadX: 30, probeSpreadY: 22, mainWeight: 18 },
  "Fazzoletto sporco": { anchorOffsetX: 0, anchorOffsetY: 10, probeSpreadX: 20, probeSpreadY: 18, mainWeight: 18 },
  "Pila scarica": { anchorOffsetX: 0, anchorOffsetY: 9, probeSpreadX: 18, probeSpreadY: 24, mainWeight: 22 },
};

export const DEFAULT_WASTE_DROP_CALIBRATION = {
  anchorOffsetX: 0,
  anchorOffsetY: 11,
  probeSpreadX: 22,
  probeSpreadY: 22,
  mainWeight: 18,
};


const getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const lastWasteSequenceSignatureByLevel = {};

const getWasteSequenceSignature = (sequence) =>
  sequence.map((item) => `${item.type}:${item.name}`).join("|");

const rememberFreshWasteSequence = (selectedLevel, sequence, pool) => {
  let result = shuffleArray(sequence);
  let signature = getWasteSequenceSignature(result);
  let attempts = 0;

  while (signature === lastWasteSequenceSignatureByLevel[selectedLevel] && attempts < 8 && pool.length > 1) {
    result = shuffleArray(result);

    if (getWasteSequenceSignature(result) === signature) {
      const selectedNames = new Set(result.map((item) => item.name));
      const replacement = shuffleArray(pool.filter((item) => !selectedNames.has(item.name)))[0];

      if (replacement) {
        result[result.length - 1] = replacement;
        result = shuffleArray(result);
      }
    }

    signature = getWasteSequenceSignature(result);
    attempts += 1;
  }

  lastWasteSequenceSignatureByLevel[selectedLevel] = signature;
  return result;
};

export const buildWasteSequence = (selectedLevel, sourcePools = WASTE_POOLS) => {
  const config = DIFFICULTY_SETTINGS[selectedLevel] || DIFFICULTY_SETTINGS.Facile;
  const pool = sourcePools?.[selectedLevel] || WASTE_POOLS[selectedLevel] || WASTE_POOLS.Facile;
  const targetCount = getRandomIntInclusive(config.minObjects, config.maxObjects);

  if (selectedLevel === "Difficile") {
    const mandatoryHardWastes = HARD_REQUIRED_TYPES
      .map((type) => shuffleArray(pool.filter((item) => item.type === type))[0])
      .filter(Boolean);

    const sequence = shuffleArray(mandatoryHardWastes).slice(0, targetCount);

    while (sequence.length < targetCount) {
      const alreadySelectedNames = sequence.map((item) => item.name);
      const availablePool = pool.filter((item) => !alreadySelectedNames.includes(item.name));
      const shuffledPool = shuffleArray(availablePool.length > 0 ? availablePool : pool);

      shuffledPool.forEach((item) => {
        if (sequence.length < targetCount) {
          sequence.push(item);
        }
      });
    }

    return rememberFreshWasteSequence(selectedLevel, sequence, pool);
  }

  const sequence = [];

  while (sequence.length < targetCount) {
    shuffleArray(pool).forEach((item) => {
      if (sequence.length < targetCount) {
        sequence.push(item);
      }
    });
  }

  return rememberFreshWasteSequence(selectedLevel, sequence, pool);
};

export const getTreeParticle = (treeId) => {
  switch (treeId) {
    case "tree_green":
      return "🍃";
    case "tree_sakura":
      return "🌸";
    case "tree_autumn":
      return "🍂";
    default:
      return "🍃";
  }
};
