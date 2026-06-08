// Application layer: prepara una partita senza conoscere React Native o Expo.
import { DIFFICULTY_SETTINGS, WASTE_POOLS, buildWasteSequence } from "../../domain/game/gameRules";

export const createGameSession = (selectedLevel, sourcePools = WASTE_POOLS) => {
  const config = DIFFICULTY_SETTINGS[selectedLevel] || DIFFICULTY_SETTINGS.Facile;
  const wastes = buildWasteSequence(selectedLevel, sourcePools || WASTE_POOLS);

  return { config, wastes };
};
