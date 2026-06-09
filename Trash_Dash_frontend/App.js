import React, { useEffect, useMemo, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SvgXml,
  SvgUri,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  Ellipse,
  Line,
  G,
} from "react-native-svg";
import { Asset } from "expo-asset";
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  StatusBar,
  useWindowDimensions,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidEmail } from "./src/application/auth/validateEmail";
import { createGameSession } from "./src/application/game/createGameSession";
import { BINS, EASY_WASTES } from "./src/domain/game/wasteCatalog";
import {
  BATTLE_DIFFICULTIES,
  BIN_DROP_CALIBRATION,
  DEFAULT_WASTE_DROP_CALIBRATION,
  DIFFICULTY_SETTINGS,
  WASTE_DROP_CALIBRATION,
  calculateCoinsEarned,
  getTreeParticle,
  normalizeBattleDifficulty,
} from "./src/domain/game/gameRules";
import {
  ITALIAN_REGION_CAPITALS,
  LOCATION_LAST_KNOWN_MAX_AGE_MS,
  LOCATION_REQUEST_TIMEOUT_MS,
  buildWastePoolsForBins,
  decorateBinsForLocalRules,
  groupCatalogWastesByDifficulty,
  getLocalRuleFallback,
  normalizeItalianRegion,
  resolveItalianAreaFromGeocodePayload,
} from "./src/domain/location/localRules";
import { apiRequest, reverseGeocodeWithBigDataCloud } from "./src/infrastructure/api/trashDashApi";
import { LOCATION_CONSENT, STORAGE_KEYS } from "./src/infrastructure/storage/storageKeys";
import {
  TRANSLATIONS,
  getShopItemMood,
  getShopItemName,
  getBinDisplayLabel,
  getWasteDescription,
  getWasteName,
} from "./src/presentation/i18n/translations";
import { styles } from "./src/presentation/styles/appStyles";

const RUNNER_DRAGON_IMAGE = require("./assets/trashdash_runner_dragon.png");

// ============================================================================
// COMPATIBILITÀ AUDIO EXPO SDK 54
// ============================================================================
// Il codice della demo usa l'API storica Audio.Sound. Expo Go SDK 54 usa
// expo-audio: questo adattatore conserva la stessa superficie minima senza
// toccare le chiamate audio già allineate al gameplay.
const Audio = {
  setAudioModeAsync: async (mode = {}) => {
    return setAudioModeAsync({
      allowsRecording: Boolean(mode.allowsRecordingIOS ?? mode.allowsRecording ?? false),
      playsInSilentMode: Boolean(mode.playsInSilentModeIOS ?? true),
      shouldPlayInBackground: Boolean(mode.staysActiveInBackground ?? mode.shouldPlayInBackground ?? false),
      interruptionMode: mode.shouldDuckAndroid ? "duckOthers" : "mixWithOthers",
      shouldRouteThroughEarpiece: Boolean(mode.playThroughEarpieceAndroid ?? false),
    });
  },
  Sound: {
    createAsync: async (source, initialStatus = {}) => {
      const player = createAudioPlayer(source, {
        updateInterval: initialStatus.progressUpdateIntervalMillis || 120,
      });
      let listener = null;

      const getStatus = () => ({
        isLoaded: Boolean(player.isLoaded ?? true),
        isPlaying: Boolean(player.playing),
        didJustFinish: Boolean(player.currentStatus?.didJustFinish),
        positionMillis: Math.round((player.currentTime || 0) * 1000),
        durationMillis: Math.round((player.duration || 0) * 1000),
      });

      if (typeof initialStatus.volume === "number") player.volume = initialStatus.volume;
      if (typeof initialStatus.isLooping === "boolean") player.loop = initialStatus.isLooping;
      if (typeof initialStatus.rate === "number" && typeof player.setPlaybackRate === "function") player.setPlaybackRate(initialStatus.rate);
      if (typeof initialStatus.shouldCorrectPitch === "boolean") player.shouldCorrectPitch = initialStatus.shouldCorrectPitch;
      if (typeof initialStatus.positionMillis === "number") await player.seekTo(initialStatus.positionMillis / 1000);
      if (initialStatus.shouldPlay) player.play();

      const sound = {
        unloadAsync: async () => {
          if (listener?.remove) listener.remove();
          listener = null;
          if (player.remove) player.remove();
        },
        setStatusAsync: async (status = {}) => {
          if (typeof status.volume === "number") player.volume = status.volume;
          if (typeof status.isLooping === "boolean") player.loop = status.isLooping;
          if (typeof status.rate === "number" && typeof player.setPlaybackRate === "function") player.setPlaybackRate(status.rate);
          if (typeof status.shouldCorrectPitch === "boolean") player.shouldCorrectPitch = status.shouldCorrectPitch;
          if (typeof status.positionMillis === "number") await player.seekTo(status.positionMillis / 1000);
          if (status.shouldPlay === true) player.play();
          if (status.shouldPlay === false) player.pause();
          return getStatus();
        },
        setVolumeAsync: async (volume) => {
          player.volume = volume;
        },
        pauseAsync: async () => {
          player.pause();
        },
        setIsLoopingAsync: async (isLooping) => {
          player.loop = isLooping;
        },
        getStatusAsync: async () => getStatus(),
        setPositionAsync: async (positionMillis) => {
          await player.seekTo(positionMillis / 1000);
        },
        playAsync: async () => {
          player.play();
        },
        stopAsync: async () => {
          player.pause();
          await player.seekTo(0);
        },
        setOnPlaybackStatusUpdate: (callback) => {
          if (listener?.remove) listener.remove();
          listener = null;
          if (typeof callback === "function" && player.addListener) {
            listener = player.addListener("playbackStatusUpdate", (status) => {
              callback({
                ...status,
                isLoaded: Boolean(status?.isLoaded ?? true),
                isPlaying: Boolean(status?.playing),
                didJustFinish: Boolean(status?.didJustFinish),
                positionMillis: Math.round((status?.currentTime || 0) * 1000),
                durationMillis: Math.round((status?.duration || 0) * 1000),
              });
            });
          }
        },
      };

      return { sound };
    },
  },
};
 
// ============================================================================
// COSTANTI E CONFIGURAZIONI DI GIOCO
// ============================================================================
 
// ============================================================================
// DIZIONARIO DI LOCALIZZAZIONE (ITALIANO / ENGLISH)
// ============================================================================
const ALBERO_SAKURA_DEFEAT_BETTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="28" ry="5" fill="#1F2937" opacity="0.35"/>
  <path d="M46 92 C47 78 47 66 45 55 C44 48 48 42 52 42 C57 43 59 49 57 57 C55 68 55 80 58 92 Z" fill="#4B2E24"/>
  <path d="M49 57 C45 50 37 47 29 44" stroke="#2B1A14" stroke-width="5" stroke-linecap="round"/>
  <path d="M54 55 C61 49 69 46 77 41" stroke="#2B1A14" stroke-width="5" stroke-linecap="round"/>
  <path d="M50 45 C48 37 43 31 37 25" stroke="#2B1A14" stroke-width="4" stroke-linecap="round"/>
  <path d="M55 45 C60 36 66 31 72 24" stroke="#2B1A14" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 62 L46 70 L52 69 L48 80" stroke="#111827" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="30" cy="45" rx="5" ry="7" fill="#E879A9" opacity="0.75" transform="rotate(-28 30 45)"/>
  <ellipse cx="73" cy="41" rx="5" ry="7" fill="#E879A9" opacity="0.72" transform="rotate(25 73 41)"/>
  <ellipse cx="34" cy="88" rx="5" ry="3" fill="#D16C93" opacity="0.55"/>
  <ellipse cx="43" cy="92" rx="4" ry="2.6" fill="#F3A7C7" opacity="0.5"/>
  <ellipse cx="62" cy="90" rx="5" ry="3" fill="#B8557B" opacity="0.5"/>
</svg>
`;
 
const ALBERO_AUTUNNALE_DEFEAT_BETTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="31" ry="5.5" fill="#111827" opacity="0.38"/>
  <path d="M43 92 C45 79 45 66 44 55 C43 48 47 41 51 41 C56 41 59 48 57 56 C55 68 56 80 61 92 Z" fill="#4B2E1F"/>
  <path d="M48 56 C39 50 30 48 21 43" stroke="#2F1B12" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M54 53 C64 47 72 41 82 35" stroke="#2F1B12" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M48 44 C42 36 36 30 27 25" stroke="#2F1B12" stroke-width="4" stroke-linecap="round"/>
  <path d="M56 43 C62 34 70 28 77 20" stroke="#2F1B12" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 60 L55 66 L50 72 L57 80" stroke="#120B07" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 43 C26 37 32 36 35 41 C32 46 27 48 24 43Z" fill="#B45309" opacity="0.75"/>
  <path d="M79 35 C82 29 88 30 89 36 C85 40 81 40 79 35Z" fill="#92400E" opacity="0.7"/>
  <path d="M27 89 C33 84 39 86 43 91 C37 95 31 95 27 89Z" fill="#92400E" opacity="0.72"/>
  <path d="M44 92 C50 86 57 88 61 94 C55 97 49 97 44 92Z" fill="#B45309" opacity="0.65"/>
  <path d="M61 90 C67 84 74 86 78 92 C72 96 66 96 61 90Z" fill="#78350F" opacity="0.7"/>
</svg>
`;

const SUNFLOWER_DEFEAT_PETALS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="88" rx="31" ry="6" fill="#111827" opacity="0.34"/>
  <circle cx="50" cy="43" r="12" fill="#7C2D12"/>
  <circle cx="50" cy="43" r="7" fill="#92400E"/>
  <path d="M50 56 C50 66 49 76 47 88" stroke="#365314" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="29" cy="78" rx="10" ry="5" fill="#FACC15" opacity="0.92" transform="rotate(-18 29 78)"/>
  <ellipse cx="42" cy="84" rx="8" ry="4" fill="#EAB308" opacity="0.85" transform="rotate(20 42 84)"/>
  <ellipse cx="58" cy="82" rx="9" ry="4.5" fill="#FDE047" opacity="0.9" transform="rotate(-12 58 82)"/>
  <ellipse cx="72" cy="76" rx="10" ry="5" fill="#F59E0B" opacity="0.82" transform="rotate(16 72 76)"/>
  <ellipse cx="35" cy="31" rx="7" ry="4" fill="#FACC15" opacity="0.65" transform="rotate(-45 35 31)"/>
  <ellipse cx="66" cy="28" rx="7" ry="4" fill="#EAB308" opacity="0.55" transform="rotate(36 66 28)"/>
</svg>
`;

const LOLLIPOP_DEFEAT_CRACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="51" cy="90" rx="28" ry="5" fill="#111827" opacity="0.3"/>
  <path d="M50 54 L50 88" stroke="#F8FAFC" stroke-width="7" stroke-linecap="round"/>
  <circle cx="50" cy="34" r="25" fill="#22C55E"/>
  <path d="M33 31 C42 15 62 16 68 33 C58 27 45 27 33 31Z" fill="#A7F3D0" opacity="0.65"/>
  <path d="M38 19 C58 15 72 29 67 47 C57 55 40 54 31 43 C28 34 31 25 38 19Z" stroke="#FB7185" stroke-width="6" opacity="0.9"/>
  <path d="M51 12 L45 29 L55 35 L47 55 L58 42 L53 34 L62 17" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M25 62 C36 66 63 66 75 61" stroke="#FB7185" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
</svg>
`;

const LOTUS_DEFEAT_PETALS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="88" rx="32" ry="6" fill="#0F172A" opacity="0.34"/>
  <path d="M25 74 C37 59 47 62 50 81 C39 85 30 83 25 74Z" fill="#F9A8D4" opacity="0.86"/>
  <path d="M75 74 C63 59 53 62 50 81 C61 85 70 83 75 74Z" fill="#F0ABFC" opacity="0.82"/>
  <path d="M39 70 C41 51 58 51 61 70 C55 78 45 78 39 70Z" fill="#FBCFE8" opacity="0.74"/>
  <ellipse cx="31" cy="88" rx="10" ry="4.6" fill="#F9A8D4" opacity="0.8" transform="rotate(-14 31 88)"/>
  <ellipse cx="49" cy="91" rx="9" ry="4.2" fill="#FBCFE8" opacity="0.75"/>
  <ellipse cx="67" cy="87" rx="10" ry="4.6" fill="#E879F9" opacity="0.72" transform="rotate(17 67 87)"/>
</svg>
`;

const ORCHID_VICTORY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="90" rx="31" ry="6" fill="#2E1065" opacity="0.32"/>
  <circle cx="74" cy="23" r="8" fill="#FDE68A" opacity="0.88"/>
  <path d="M50 58 C50 72 48 81 45 91" stroke="#14532D" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="50" cy="35" rx="13" ry="24" fill="#D946EF"/>
  <ellipse cx="35" cy="46" rx="12" ry="20" fill="#C084FC" transform="rotate(-45 35 46)"/>
  <ellipse cx="65" cy="46" rx="12" ry="20" fill="#F472B6" transform="rotate(45 65 46)"/>
  <ellipse cx="50" cy="55" rx="12" ry="15" fill="#F0ABFC"/>
  <circle cx="50" cy="47" r="7" fill="#FDE68A"/>
  <circle cx="27" cy="26" r="2.2" fill="#FFFFFF" opacity="0.85"/>
  <circle cx="80" cy="48" r="1.8" fill="#FFFFFF" opacity="0.75"/>
</svg>
`;

const ORCHID_DEFEAT_MAGENTA_PETALS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="90" rx="32" ry="6" fill="#111827" opacity="0.34"/>
  <path d="M51 52 C50 68 49 80 47 91" stroke="#3F3F46" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="37" cy="80" rx="12" ry="5" fill="#D946EF" opacity="0.78" transform="rotate(-20 37 80)"/>
  <ellipse cx="54" cy="86" rx="11" ry="5" fill="#C026D3" opacity="0.72" transform="rotate(12 54 86)"/>
  <ellipse cx="69" cy="79" rx="10" ry="4.5" fill="#F472B6" opacity="0.72" transform="rotate(24 69 79)"/>
  <ellipse cx="44" cy="38" rx="8" ry="14" fill="#A21CAF" opacity="0.46" transform="rotate(-35 44 38)"/>
  <ellipse cx="60" cy="38" rx="8" ry="14" fill="#BE185D" opacity="0.42" transform="rotate(35 60 38)"/>
</svg>
`;

const CORAL_VICTORY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="90" rx="33" ry="6" fill="#831843" opacity="0.26"/>
  <path d="M50 86 C50 66 50 48 50 28" stroke="#FB7185" stroke-width="10" stroke-linecap="round"/>
  <path d="M50 55 C38 48 31 40 27 28" stroke="#F472B6" stroke-width="8" stroke-linecap="round"/>
  <path d="M51 61 C64 53 72 43 76 30" stroke="#FDA4AF" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 42 C60 36 65 29 67 20" stroke="#F9A8D4" stroke-width="7" stroke-linecap="round"/>
  <path d="M43 68 C34 63 28 57 24 48" stroke="#FB7185" stroke-width="7" stroke-linecap="round"/>
  <circle cx="26" cy="27" r="4" fill="#FDE68A"/>
  <circle cx="76" cy="29" r="4" fill="#FDE68A"/>
  <circle cx="67" cy="20" r="3.5" fill="#FDE68A"/>
  <circle cx="50" cy="27" r="4" fill="#FDE68A"/>
</svg>
`;

const CORAL_DEFEAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="90" rx="33" ry="6" fill="#111827" opacity="0.34"/>
  <path d="M50 84 C50 67 50 51 50 35" stroke="#9F7AEA" stroke-width="9" stroke-linecap="round" opacity="0.72"/>
  <path d="M50 57 C39 52 34 44 30 34" stroke="#7C3AED" stroke-width="7" stroke-linecap="round" opacity="0.62"/>
  <path d="M51 63 C62 56 68 48 72 39" stroke="#A78BFA" stroke-width="7" stroke-linecap="round" opacity="0.58"/>
  <path d="M37 78 L31 86 L43 84" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <path d="M66 78 L74 84 L62 86" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="34" r="3.6" fill="#CBD5E1" opacity="0.75"/>
</svg>
`;

const CRYSTAL_VICTORY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="34" ry="6" fill="#075985" opacity="0.28"/>
  <path d="M50 8 L76 36 L65 86 H35 L24 36 Z" fill="#67E8F9"/>
  <path d="M50 8 L50 86 L24 36 Z" fill="#38BDF8" opacity="0.72"/>
  <path d="M50 8 L76 36 L50 86 Z" fill="#A78BFA" opacity="0.55"/>
  <path d="M24 36 H76" stroke="#ECFEFF" stroke-width="3" opacity="0.75"/>
  <path d="M35 86 L50 36 L65 86" stroke="#FFFFFF" stroke-width="2.5" opacity="0.75"/>
  <circle cx="25" cy="20" r="2.4" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="78" cy="62" r="2" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="67" cy="18" r="1.8" fill="#FFFFFF" opacity="0.75"/>
</svg>
`;

const CRYSTAL_DEFEAT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="91" rx="34" ry="6" fill="#111827" opacity="0.36"/>
  <path d="M49 13 L70 38 L61 84 H36 L25 39 Z" fill="#64748B"/>
  <path d="M49 13 L49 84 L25 39 Z" fill="#475569"/>
  <path d="M49 13 L70 38 L49 84 Z" fill="#94A3B8" opacity="0.55"/>
  <path d="M38 25 L52 39 L45 48 L58 61 L51 82" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M67 72 L80 82 L63 86" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M31 78 L20 86 L36 86" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const createTreeSkinSvg = ({
  leaf = "#22C55E",
  leaf2 = "#86EFAC",
  accent = "#BBF7D0",
  trunk = "#7C4A2D",
  ground = "#064E3B",
  shape = "round",
  defeated = false,
  victory = false,
}) => {
  const crownOpacity = defeated ? 0.58 : 1;
  const shadow = defeated ? "#111827" : ground;
  const sparkleOpacity = victory ? 0.85 : 0.18;
  const branchStroke = defeated ? "#2B1A14" : trunk;
  const leafMain = defeated ? "#475569" : leaf;
  const leafAlt = defeated ? "#64748B" : leaf2;
  const leafAccent = defeated ? "#94A3B8" : accent;

  const crown =
    shape === "pine"
      ? `
        <path d="M50 9 L26 47 H38 L20 75 H42 L32 91 H68 L60 75 H80 L62 47 H74 Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M50 18 L34 45 H45 L30 68 H50 Z" fill="${leafAlt}" opacity="${defeated ? 0.32 : 0.48}"/>
      `
      : shape === "palm"
      ? `
        <path d="M50 26 C29 12 16 14 7 29 C25 27 38 33 49 44 Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M50 25 C62 8 78 8 91 24 C73 25 61 33 50 44 Z" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <path d="M50 29 C38 36 29 47 25 63 C40 57 49 49 54 40 Z" fill="${leafMain}" opacity="${crownOpacity * 0.88}"/>
        <path d="M51 29 C66 35 78 47 84 64 C67 57 58 49 53 40 Z" fill="${leafAlt}" opacity="${crownOpacity * 0.88}"/>
      `
      : shape === "bamboo"
      ? `
        <path d="M28 16 C45 24 46 43 30 51 C20 40 18 25 28 16Z" fill="${leafMain}" opacity="${crownOpacity}"/>
        <path d="M71 18 C55 24 54 43 70 51 C80 40 81 27 71 18Z" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <path d="M38 44 C48 32 61 35 68 48 C56 60 45 58 38 44Z" fill="${leafAccent}" opacity="${defeated ? 0.42 : 0.76}"/>
      `
      : `
        <circle cx="38" cy="39" r="23" fill="${leafMain}" opacity="${crownOpacity}"/>
        <circle cx="59" cy="34" r="25" fill="${leafAlt}" opacity="${crownOpacity}"/>
        <circle cx="52" cy="55" r="27" fill="${leafMain}" opacity="${crownOpacity * 0.92}"/>
        <circle cx="30" cy="57" r="18" fill="${leafAlt}" opacity="${crownOpacity * 0.82}"/>
        <circle cx="70" cy="58" r="18" fill="${leafAccent}" opacity="${defeated ? 0.35 : 0.72}"/>
      `;

  const decay = defeated
    ? `
      <path d="M32 39 C42 54 59 52 71 39" stroke="#111827" stroke-width="3.2" stroke-linecap="round" opacity="0.72"/>
      <path d="M40 72 L34 82 L45 80 L38 93" stroke="#111827" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>
      <ellipse cx="29" cy="91" rx="5" ry="3" fill="${leafAlt}" opacity="0.62"/>
      <ellipse cx="67" cy="92" rx="6" ry="3" fill="${leafMain}" opacity="0.5"/>
    `
    : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="92" rx="32" ry="6" fill="${shadow}" opacity="0.34"/>
  <path d="M45 92 C47 76 47 63 45 51 C44 43 48 38 52 38 C57 39 59 45 57 52 C55 64 56 77 62 92 Z" fill="${trunk}"/>
  <path d="M50 55 C43 50 36 48 27 45" stroke="${branchStroke}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M55 53 C63 48 72 45 80 39" stroke="${branchStroke}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M50 44 C46 36 40 30 32 24" stroke="${branchStroke}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M55 43 C62 34 69 28 78 21" stroke="${branchStroke}" stroke-width="3.4" stroke-linecap="round"/>
  ${crown}
  <circle cx="35" cy="31" r="2.3" fill="#FFFFFF" opacity="${sparkleOpacity}"/>
  <circle cx="68" cy="40" r="2" fill="#FFFFFF" opacity="${sparkleOpacity * 0.86}"/>
  <circle cx="51" cy="20" r="1.8" fill="#FFFFFF" opacity="${sparkleOpacity * 0.72}"/>
  ${decay}
</svg>`;
};

const makeTreeSkin = (config) => ({
  ...config,
  baseSvg: createTreeSkinSvg(config),
  victorySvg: createTreeSkinSvg({ ...config, victory: true }),
  defeatSvg: createTreeSkinSvg({ ...config, defeated: true }),
});

const EXTRA_TREE_ITEMS = [
  makeTreeSkin({ id: "tree_pine_alpine", name: "Pino Alpino", cost: 170, type: "Estetico", iconHealthy: "🌲", iconDead: "🪵", moodHealthy: "Pino Cristallino", moodDead: "Aghi Spenti", bgHealthy: "rgba(14, 165, 233, 0.22)", bgDead: "#1E293B", borderColor: "#38BDF8", leaf: "#0EA5E9", leaf2: "#67E8F9", accent: "#E0F2FE", trunk: "#6B4E32", ground: "#0C4A6E", shape: "pine" }),
  makeTreeSkin({ id: "tree_olive_mediterranean", name: "Ulivo Mediterraneo", cost: 190, type: "Estetico", iconHealthy: "🫒", iconDead: "🍂", moodHealthy: "Argento Mediterraneo", moodDead: "Rami Assetati", bgHealthy: "rgba(132, 204, 22, 0.22)", bgDead: "#27311B", borderColor: "#A3E635", leaf: "#84CC16", leaf2: "#BEF264", accent: "#EAB308", trunk: "#7C4A2D", ground: "#365314" }),
  makeTreeSkin({ id: "tree_bonsai_zen", name: "Bonsai Zen", cost: 210, type: "Estetico", iconHealthy: "🎍", iconDead: "🪾", moodHealthy: "Equilibrio Zen", moodDead: "Vaso Crepato", bgHealthy: "rgba(20, 184, 166, 0.22)", bgDead: "#20363A", borderColor: "#2DD4BF", leaf: "#14B8A6", leaf2: "#99F6E4", accent: "#FDE68A", trunk: "#6B3F2A", ground: "#134E4A", shape: "bamboo" }),
  makeTreeSkin({ id: "tree_palm_tropical", name: "Palma Tropicale", cost: 230, type: "Estetico", iconHealthy: "🌴", iconDead: "🥥", moodHealthy: "Brezza Tropicale", moodDead: "Frasche Secche", bgHealthy: "rgba(16, 185, 129, 0.22)", bgDead: "#3A2D1F", borderColor: "#34D399", leaf: "#10B981", leaf2: "#6EE7B7", accent: "#FACC15", trunk: "#9A673A", ground: "#064E3B", shape: "palm" }),
  makeTreeSkin({ id: "tree_oak_ancient", name: "Quercia Antica", cost: 250, type: "Estetico", iconHealthy: "🌳", iconDead: "🪵", moodHealthy: "Chioma Sovrana", moodDead: "Corteccia Ferita", bgHealthy: "rgba(22, 163, 74, 0.22)", bgDead: "#2A241D", borderColor: "#22C55E", leaf: "#15803D", leaf2: "#4ADE80", accent: "#A7F3D0", trunk: "#5B341F", ground: "#14532D" }),
  makeTreeSkin({ id: "tree_willow_luminous", name: "Salice Luminoso", cost: 270, type: "Estetico", iconHealthy: "🌿", iconDead: "🍃", moodHealthy: "Fronda Lucente", moodDead: "Rami Chinati", bgHealthy: "rgba(6, 182, 212, 0.2)", bgDead: "#1D2F38", borderColor: "#22D3EE", leaf: "#06B6D4", leaf2: "#A5F3FC", accent: "#ECFEFF", trunk: "#6B4A34", ground: "#164E63" }),
  makeTreeSkin({ id: "tree_birch_moon", name: "Betulla Lunare", cost: 290, type: "Estetico", iconHealthy: "🌙", iconDead: "🌑", moodHealthy: "Corteccia Lunare", moodDead: "Luce Velata", bgHealthy: "rgba(226, 232, 240, 0.18)", bgDead: "#273344", borderColor: "#CBD5E1", leaf: "#CBD5E1", leaf2: "#F8FAFC", accent: "#93C5FD", trunk: "#F8FAFC", ground: "#334155" }),
  makeTreeSkin({ id: "tree_maple_red", name: "Acero Rosso", cost: 310, type: "Estetico", iconHealthy: "🍁", iconDead: "🍂", moodHealthy: "Rosso Brillante", moodDead: "Foglie Bruciate", bgHealthy: "rgba(239, 68, 68, 0.2)", bgDead: "#3B1F24", borderColor: "#F87171", leaf: "#DC2626", leaf2: "#F97316", accent: "#FDE68A", trunk: "#5B2E1D", ground: "#7F1D1D" }),
  makeTreeSkin({ id: "tree_cypress_elegant", name: "Cipresso Elegante", cost: 330, type: "Estetico", iconHealthy: "🌲", iconDead: "🪵", moodHealthy: "Profilo Elegante", moodDead: "Verde Spento", bgHealthy: "rgba(21, 128, 61, 0.22)", bgDead: "#1E2B24", borderColor: "#16A34A", leaf: "#166534", leaf2: "#22C55E", accent: "#86EFAC", trunk: "#6F4329", ground: "#052E16", shape: "pine" }),
  makeTreeSkin({ id: "tree_baobab_solar", name: "Baobab Solare", cost: 350, type: "Estetico", iconHealthy: "☀️", iconDead: "🌘", moodHealthy: "Sole Savana", moodDead: "Tramonto Secco", bgHealthy: "rgba(245, 158, 11, 0.22)", bgDead: "#3A2D22", borderColor: "#F59E0B", leaf: "#EAB308", leaf2: "#FDE68A", accent: "#FB923C", trunk: "#8B5A2B", ground: "#78350F" }),
  makeTreeSkin({ id: "tree_mangrove_blue", name: "Mangrovia Blu", cost: 370, type: "Estetico", iconHealthy: "💧", iconDead: "🫧", moodHealthy: "Radici d'Acqua", moodDead: "Marea Bassa", bgHealthy: "rgba(59, 130, 246, 0.2)", bgDead: "#1E293B", borderColor: "#60A5FA", leaf: "#2563EB", leaf2: "#93C5FD", accent: "#BAE6FD", trunk: "#674A32", ground: "#1D4ED8" }),
  makeTreeSkin({ id: "tree_cedar_snow", name: "Cedro Nevoso", cost: 390, type: "Estetico", iconHealthy: "❄️", iconDead: "🌨️", moodHealthy: "Neve Pulita", moodDead: "Gelo Opaco", bgHealthy: "rgba(186, 230, 253, 0.22)", bgDead: "#253241", borderColor: "#BAE6FD", leaf: "#0F766E", leaf2: "#CCFBF1", accent: "#FFFFFF", trunk: "#6B4A32", ground: "#155E75", shape: "pine" }),
  makeTreeSkin({ id: "tree_eucalyptus_rainbow", name: "Eucalipto Arcobaleno", cost: 410, type: "Estetico", iconHealthy: "🌈", iconDead: "🌫️", moodHealthy: "Corteccia Arcobaleno", moodDead: "Colori Lavati", bgHealthy: "rgba(168, 85, 247, 0.2)", bgDead: "#322844", borderColor: "#C084FC", leaf: "#22C55E", leaf2: "#A78BFA", accent: "#F472B6", trunk: "#A855F7", ground: "#4C1D95" }),
  makeTreeSkin({ id: "tree_bamboo_grove", name: "Bosco di Bambù", cost: 430, type: "Estetico", iconHealthy: "🎍", iconDead: "🪾", moodHealthy: "Canne Vivaci", moodDead: "Steli Spezzati", bgHealthy: "rgba(101, 163, 13, 0.22)", bgDead: "#26321F", borderColor: "#84CC16", leaf: "#65A30D", leaf2: "#D9F99D", accent: "#F7FEE7", trunk: "#84CC16", ground: "#3F6212", shape: "bamboo" }),
  makeTreeSkin({ id: "tree_ficus_city", name: "Ficus Urbano", cost: 450, type: "Estetico", iconHealthy: "🏙️", iconDead: "🌁", moodHealthy: "Verde Metropolitano", moodDead: "Smog sulle Foglie", bgHealthy: "rgba(45, 212, 191, 0.2)", bgDead: "#243239", borderColor: "#2DD4BF", leaf: "#0D9488", leaf2: "#5EEAD4", accent: "#F8FAFC", trunk: "#704B32", ground: "#134E4A" }),
  { id: "flower_sunflower_patch", name: "Girasole Radioso", cost: 160, type: "Estetico", iconHealthy: "🌻", iconDead: "🌼", moodHealthy: "Sole Aperto", moodDead: "Petali Spenti", bgHealthy: "rgba(250, 204, 21, 0.22)", bgDead: "#3B2F18", borderColor: "#FACC15", defeatSvg: SUNFLOWER_DEFEAT_PETALS_SVG },
  { id: "candy_tree", name: "Leccalecca Verde", cost: 180, type: "Estetico", iconHealthy: "🍭", iconDead: "🍬", moodHealthy: "Dolce Vivace", moodDead: "Zucchero Crepato", bgHealthy: "rgba(251, 113, 133, 0.2)", bgDead: "#3B2431", borderColor: "#FB7185", defeatSvg: LOLLIPOP_DEFEAT_CRACK_SVG },
  { id: "flower_lotus_pond", name: "Fiore di Loto", cost: 240, type: "Estetico", iconHealthy: "🪷", iconDead: "🌸", moodHealthy: "Loto Sereno", moodDead: "Petali di Loto", bgHealthy: "rgba(45, 212, 191, 0.2)", bgDead: "#1E3440", borderColor: "#2DD4BF", defeatSvg: LOTUS_DEFEAT_PETALS_SVG },
  { id: "leaf_crystal_veil", name: "Foglia Cristallina", cost: 40, type: "Estetico", iconHealthy: "🍃", iconDead: "🍂", moodHealthy: "Nervature Lucenti", moodDead: "Foglia Opaca", bgHealthy: "rgba(125, 211, 252, 0.2)", bgDead: "#263241", borderColor: "#7DD3FC" },
  { id: "flower_nebula", name: "Orchidea Lunare", cost: 520, type: "Estetico", iconHealthy: "🌺", iconDead: "🌸", moodHealthy: "Fioritura Lunare", moodDead: "Petali Magenta", bgHealthy: "rgba(168, 85, 247, 0.2)", bgDead: "#27213A", borderColor: "#C084FC", victorySvg: ORCHID_VICTORY_SVG, defeatSvg: ORCHID_DEFEAT_MAGENTA_PETALS_SVG },
  { id: "coral_garden", name: "Corallo Regale", cost: 760, type: "Estetico", iconHealthy: "🪸", iconDead: "🪨", moodHealthy: "Ramo Corallino", moodDead: "Corallo Pallido", bgHealthy: "rgba(244, 114, 182, 0.2)", bgDead: "#3A2731", borderColor: "#F472B6", victorySvg: CORAL_VICTORY_SVG, defeatSvg: CORAL_DEFEAT_SVG },
  { id: "crystal_bloom", name: "Cristallo Prisma", cost: 980, type: "Estetico", iconHealthy: "💎", iconDead: "🪨", moodHealthy: "Taglio Prismatico", moodDead: "Scheggia Opaca", bgHealthy: "rgba(14, 165, 233, 0.22)", bgDead: "#202C38", borderColor: "#38BDF8", victorySvg: CRYSTAL_VICTORY_SVG, defeatSvg: CRYSTAL_DEFEAT_SVG },
];
 
const INITIAL_SHOP_ITEMS = [
  {
    id: "tree_green",
    name: "Parco Urbano",
    cost: 0,
    type: "Estetico",
    iconHealthy: "🌳",
    iconDead: "🪾",
    moodHealthy: "Albero Rigoglioso",
    moodDead: "Perdita Foglie Classiche",
    bgHealthy: "rgba(168, 230, 207, 0.25)",
    bgDead: "#475569",
    borderColor: "#4ADE80",
    ...makeTreeSkin({
      leaf: "#22C55E",
      leaf2: "#86EFAC",
      accent: "#BBF7D0",
      trunk: "#7C4A2D",
      ground: "#14532D",
    }),
    bought: true,
  },
  {
    id: "tree_sakura",
    name: "Bosco Fiorito",
    cost: 120,
    type: "Estetico",
    iconHealthy: "🌸",
    iconDead: "🌸",
    moodHealthy: "Sakura in Fiore",
    moodDead: "Perdita Petali Rosa",
    bgHealthy: "rgba(244, 114, 182, 0.25)",
    bgDead: "#5C4048",
    borderColor: "#F472B6",
    ...makeTreeSkin({
      leaf: "#F472B6",
      leaf2: "#FDA4AF",
      accent: "#FDE68A",
      trunk: "#7C4A2D",
      ground: "#831843",
    }),
    bought: false,
  },
  {
    id: "tree_autumn",
    name: "Bosco Autunnale",
    cost: 140,
    type: "Estetico",
    iconHealthy: "🍁",
    iconDead: "🍁",
    moodHealthy: "Chioma Dorata",
    moodDead: "Perdita Foglie Autunnali",
    bgHealthy: "rgba(234, 88, 12, 0.25)",
    bgDead: "#452A1E",
    borderColor: "#EA580C",
    ...makeTreeSkin({
      leaf: "#EA580C",
      leaf2: "#F59E0B",
      accent: "#FDE68A",
      trunk: "#6B3F24",
      ground: "#7C2D12",
    }),
    bought: false,
  },
  {
    id: "tree_autumn_svg",
    name: "Albero Autunnale",
    cost: 80,
    type: "Estetico",
    iconHealthy: "🍁",
    iconDead: "🍂",
    moodHealthy: "Chioma Autunnale",
    moodDead: "Rami Secchi Autunnali",
    bgHealthy: "rgba(234, 88, 12, 0.25)",
    bgDead: "#3A2418",
    borderColor: "#EA580C",
    baseSvgAsset: require("./albero-autunnale-base.svg"),
victorySvgAsset: require("./albero-autunnale-victory.svg"),
defeatSvg: ALBERO_AUTUNNALE_DEFEAT_BETTER_SVG,
    bought: false,
  },
  ...EXTRA_TREE_ITEMS.map((item) => ({ ...item, bought: false })),
];
 
function CosmeticVisual({ item, variant = "base", size = 64, emojiStyle, animated = true }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      glowAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [variant, animated]);

  const svgXml =
    variant === "victory"
      ? item.victorySvg
      : variant === "defeat"
      ? item.defeatSvg
      : item.baseSvg;

  const svgAsset =
    variant === "victory"
      ? item.victorySvgAsset
      : variant === "defeat"
      ? item.defeatSvgAsset
      : item.baseSvgAsset;

  const renderVisual = () => {
    if (svgXml && svgXml.includes("<svg") && svgXml.includes("</svg>")) {
      return <SvgXml xml={svgXml} width={size} height={size} />;
    }

    if (svgAsset) {
      const assetUri = Asset.fromModule(svgAsset).uri;
      return <SvgUri uri={assetUri} width={size} height={size} />;
    }

    return (
      <Text
        allowFontScaling={false}
        style={[
          emojiStyle,
          styles.ecoCosmeticFallback,
          { fontSize: Math.max(28, size * 0.72) },
        ]}
      >
        {variant === "defeat" ? item.iconDead : item.iconHealthy}
      </Text>
    );
  };

  const glowOpacity = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.18, variant === "defeat" ? 0.26 : 0.46],
      })
    : variant === "defeat"
    ? 0.18
    : 0.24;

  const visualScale = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, variant === "defeat" ? 1.02 : 1.045],
      })
    : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ecoCosmeticFrame,
        { width: size * 1.38, height: size * 1.38 },
      ]}
    >
      <Animated.View
        style={[
          styles.ecoCosmeticGlow,
          variant === "defeat" ? styles.ecoCosmeticGlowDirty : styles.ecoCosmeticGlowClean,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ecoCosmeticInner,
          {
            transform: [{ scale: visualScale }],
          },
        ]}
      >
        {renderVisual()}
      </Animated.View>
    </View>
  );
}
 
let globalButtonSfxHandler = null;
 
const playGlobalButtonSfx = () => {
  if (typeof globalButtonSfxHandler === "function") {
    globalButtonSfxHandler();
  }
};
 
function FancyButton({ label, onPress, active, disabled, small, style, textStyle }) {
 
const handlePress = (event) => {
  playGlobalButtonSfx();
 
  if (typeof onPress === "function") {
    onPress(event);
  }
};
 
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.fancyButton,
        active && styles.fancyButtonActive,
        disabled && styles.fancyButtonDisabled,
        small && styles.fancyButtonSmall,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[
          styles.fancyButtonText,
          small && styles.fancyButtonTextSmall,
          active && styles.fancyButtonTextActive,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
 
function GoBackButton({ onPress }) {
 
const handlePress = (event) => {
  playGlobalButtonSfx();
 
  if (typeof onPress === "function") {
    onPress(event);
  }
};
 
  return (
    <TouchableOpacity onPress={handlePress} style={styles.goBackButton}>
      <Text allowFontScaling={false} style={styles.goBackButtonText}>
        {"‹ Menu"}
      </Text>
    </TouchableOpacity>
  );
}
 
 
function PowerExitButton({ onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.powerExitButton}
    >
      <Svg width={42} height={42} viewBox="0 0 64 64">
        <Circle cx="32" cy="32" r="30" fill="#EF1B24" />
        <Circle cx="32" cy="32" r="27" fill="#F7252D" opacity="0.96" />
        <Path
          d="M21.5 22.8 C17.2 26.6 14.8 31.9 14.8 37.6 C14.8 47.1 22.5 54.8 32 54.8 C41.5 54.8 49.2 47.1 49.2 37.6 C49.2 31.9 46.8 26.6 42.5 22.8"
          stroke="#FFFFFF"
          strokeWidth="8.2"
          strokeLinecap="round"
          fill="none"
        />
        <Line
          x1="32"
          y1="13"
          x2="32"
          y2="29.5"
          stroke="#FFFFFF"
          strokeWidth="8.5"
          strokeLinecap="square"
        />
      </Svg>
    </TouchableOpacity>
  );
}
 
function ToggleRow({ label, value, onChange }) {
  return (
    <View style={styles.settingToggleItemRow}>
      <Text allowFontScaling={false} style={styles.settingItemLabelText}>
        {label}:
      </Text>
 
      <View style={styles.toggleButtonsGroupContainer}>
        <TouchableOpacity
          onPress={() => {
            playGlobalButtonSfx();
            onChange(true);
          }}
          style={[styles.toggleBlockItem, value && styles.toggleBlockItemActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.toggleBlockText, value && styles.toggleBlockTextActive]}
          >
            ON
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          onPress={() => {
            playGlobalButtonSfx();
            onChange(false);
          }}
          style={[styles.toggleBlockItem, !value && styles.toggleBlockItemActive]}
        >
          <Text
            allowFontScaling={false}
            style={[styles.toggleBlockText, !value && styles.toggleBlockTextActive]}
          >
            OFF
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
function GreenhouseBackground({ muted = false, disableLeaves = false, performanceMode = false }) {
  const breezeAnim = useRef(new Animated.Value(0)).current;
  const cityGlowAnim = useRef(new Animated.Value(0)).current;

  const leafConfigs = useRef(
    Array.from({ length: disableLeaves || performanceMode ? 0 : 9 }, (_, index) => ({
      left: -18 + ((index * 29) % 132),
      top: -18 - ((index * 23) % 80),
      duration: 4500 + (index % 5) * 380,
      delay: (index % 7) * 210,
      size: 11 + (index % 3) * 2,
      driftX: 150 + (index % 4) * 30,
      driftY: 610 + (index % 4) * 42,
      rotate: index % 2 === 0 ? "145deg" : "-125deg",
      glyph: ["🍃", "🌿"][index % 2],
    }))
  ).current;

  const leaves = useRef(leafConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (performanceMode) {
      breezeAnim.setValue(0);
      cityGlowAnim.setValue(0);
      leaves.forEach((leaf) => leaf.setValue(0));
      return;
    }

    const breeze = Animated.loop(
      Animated.sequence([
        Animated.timing(breezeAnim, {
          toValue: 1,
          duration: 7800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(breezeAnim, {
          toValue: 0,
          duration: 7800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(cityGlowAnim, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(cityGlowAnim, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const leafRuns = leaves.map((leaf, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(leaf, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(leafConfigs[index].delay),
          Animated.timing(leaf, {
            toValue: 1,
            duration: leafConfigs[index].duration,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(leaf, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const animation = Animated.parallel([breeze, glow, ...leafRuns]);
    animation.start();

    return () => animation.stop();
  }, [muted, performanceMode]);

  const breezeShift = performanceMode
    ? 0
    : breezeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-18, 24],
      });

  const breezeOpacity = performanceMode
    ? 0
    : breezeAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.045, muted ? 0.075 : 0.13, 0.045],
      });

  const cityGlowOpacity = performanceMode
    ? muted
      ? 0.1
      : 0.14
    : cityGlowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.12, muted ? 0.16 : 0.28],
      });

  const leafStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    fontSize: config.size,
    opacity: animVal.interpolate({
      inputRange: [0, 0.12, 0.72, 1],
      outputRange: [0, muted ? 0.14 : 0.34, muted ? 0.09 : 0.22, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftY],
        }),
      },
      {
        rotate: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", config.rotate],
        }),
      },
    ],
  });

  return (
    <View pointerEvents="none" style={styles.greenhouseBackgroundLayer}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        style={[styles.greenhouseSvgBackdrop, muted && styles.greenhouseSvgBackdropMuted]}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="ecoCitySky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#062B3B" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#031926" stopOpacity="1" />
            <Stop offset="1" stopColor="#020811" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="ecoCityLine" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="1" />
            <Stop offset="0.55" stopColor="#14B8A6" stopOpacity="1" />
            <Stop offset="1" stopColor="#84CC16" stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="ecoStreet" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14534B" stopOpacity="0.46" />
            <Stop offset="0.7" stopColor="#071B28" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#020611" stopOpacity="0.98" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="844" fill="#020811" />
        <Rect x="18" y="18" width="354" height="808" rx="32" fill="url(#ecoCitySky)" opacity="0.98" />

        <Path d="M48 191 C89 70 301 70 342 191" stroke="url(#ecoCityLine)" strokeWidth="3.2" opacity="0.46" fill="none" />
        <Path d="M62 222 C104 104 286 104 328 222" stroke="#0EA5E9" strokeWidth="2" opacity="0.16" fill="none" />

        <Line x1="195" y1="56" x2="195" y2="420" stroke="#031C2C" strokeWidth="8" opacity="0.64" />
        <Line x1="195" y1="72" x2="52" y2="440" stroke="#031C2C" strokeWidth="6" opacity="0.52" />
        <Line x1="195" y1="72" x2="338" y2="440" stroke="#031C2C" strokeWidth="6" opacity="0.52" />

        <Path d="M142 360 L88 826 H302 L248 360 Z" fill="url(#ecoStreet)" opacity="0.72" />
        <Line x1="166" y1="390" x2="132" y2="814" stroke="#D9FFF2" strokeWidth="2.5" opacity="0.13" />
        <Line x1="224" y1="390" x2="258" y2="814" stroke="#D9FFF2" strokeWidth="2.5" opacity="0.13" />
        <Line x1="115" y1="610" x2="275" y2="610" stroke="#2DD4BF" strokeWidth="2" opacity="0.08" />
        <Line x1="102" y1="708" x2="288" y2="708" stroke="#2DD4BF" strokeWidth="2" opacity="0.07" />

        <G opacity="0.5">
          <Rect x="58" y="386" width="20" height="92" rx="4" fill="#073B3A" />
          <Rect x="83" y="348" width="26" height="130" rx="4" fill="#062E37" />
          <Rect x="282" y="360" width="24" height="118" rx="4" fill="#062E37" />
          <Rect x="313" y="398" width="18" height="80" rx="4" fill="#073B3A" />
        </G>

        <Circle cx="70" cy="470" r="3" fill="#86EFAC" opacity="0.32" />
        <Circle cx="101" cy="438" r="2.5" fill="#22D3EE" opacity="0.24" />
        <Circle cx="292" cy="444" r="2.5" fill="#22D3EE" opacity="0.24" />
        <Circle cx="322" cy="480" r="3" fill="#86EFAC" opacity="0.32" />

        <Ellipse cx="72" cy="690" rx="25" ry="104" fill="#0B5B3F" opacity="0.42" transform="rotate(-31 72 690)" />
        <Ellipse cx="316" cy="710" rx="25" ry="104" fill="#0B5B3F" opacity="0.42" transform="rotate(31 316 710)" />

        <Rect
          x="18"
          y="18"
          width="354"
          height="808"
          rx="32"
          fill="none"
          stroke="url(#ecoCityLine)"
          strokeWidth="3.2"
          opacity="0.34"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ecoCitySoftGlow,
          {
            opacity: cityGlowOpacity,
          },
        ]}
      />

      {!performanceMode && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ecoCityBreezeLayer,
            {
              opacity: breezeOpacity,
              transform: [{ translateX: breezeShift }],
            },
          ]}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              pointerEvents="none"
              style={[
                styles.ecoCityBreezeLine,
                {
                  top: String(18 + index * 14) + "%",
                  left: String(-14 + index * 10) + "%",
                  width: 110 + (index % 2) * 36,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {!performanceMode && (
        <View pointerEvents="none" style={styles.ecoCityLeafLayer}>
          {leaves.map((leaf, index) => (
            <Animated.Text
              key={index}
              allowFontScaling={false}
              pointerEvents="none"
              style={[styles.ecoCityLeaf, leafStyle(leaf, leafConfigs[index])]}
            >
              {leafConfigs[index].glyph}
            </Animated.Text>
          ))}
        </View>
      )}
    </View>
  );
}
 
function ScreenShell({ muted = true, disableLeaves = false, performanceMode = false, children }) {
  return (
    <SafeAreaView style={styles.container}>
      <GreenhouseBackground disableLeaves={disableLeaves} muted={muted} performanceMode={performanceMode} />
      <View style={styles.screenForegroundLayer}>{children}</View>
    </SafeAreaView>
  );
}
 
function Px({ x, y, w, h, fill, opacity = 1, rx = 0 }) {
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      opacity={opacity}
    />
  );
}
 
function EcoDinoBodySvg({ width = 210, height = 150 } = {}) {
  const WHITE = "#F8FAFC";
  const LIGHT = "#FFFFFF";
  const MID = "#E5E7EB";
  const SHADE = "#CBD5E1";
  const DARK = "#64748B";
  const BAG = "#05070A";
  const BAG_2 = "#111827";
  const BAG_3 = "#1F2937";
  const GREEN = "#39FF7A";
  const GREEN_DARK = "#16A34A";
 
  return (
    <Svg width={width} height={height} viewBox="0 0 210 150">
      <Defs>
        <LinearGradient id="trashDinoBag" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#374151" stopOpacity="1" />
          <Stop offset="0.34" stopColor="#111827" stopOpacity="1" />
          <Stop offset="0.75" stopColor="#05070A" stopOpacity="1" />
          <Stop offset="1" stopColor="#000000" stopOpacity="1" />
        </LinearGradient>
 
        <LinearGradient id="trashDinoWhite" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="0.45" stopColor="#F1F5F9" stopOpacity="1" />
          <Stop offset="1" stopColor="#CBD5E1" stopOpacity="1" />
        </LinearGradient>
      </Defs>
 
      {/* sacco nero dietro */}
      <Px x={32} y={72} w={18} h={12} fill={BAG_3} opacity={0.8} />
      <Px x={20} y={84} w={42} h={12} fill={BAG_2} />
      <Px x={14} y={96} w={60} h={12} fill="url(#trashDinoBag)" />
      <Px x={20} y={108} w={66} h={12} fill="url(#trashDinoBag)" />
      <Px x={32} y={120} w={48} h={12} fill={BAG} />
      <Px x={50} y={132} w={24} h={6} fill={BAG} opacity={0.9} />
 
      {/* nodo sacco */}
      <Px x={54} y={66} w={24} h={12} fill={BAG_2} />
      <Px x={60} y={60} w={12} h={6} fill={BAG_3} />
 
      {/* riflessi sacco */}
      <Px x={28} y={90} w={30} h={6} fill="#FFFFFF" opacity={0.12} />
      <Px x={38} y={102} w={24} h={6} fill="#FFFFFF" opacity={0.08} />
 
      {/* simbolo riciclo sul sacco */}
      <G transform="translate(34 94) scale(0.95)">
        <Path
          d="M15 0 L25 6 L20 9 L23 14 L15 14 L11.5 8.5 L6.5 11.5 Z"
          fill={GREEN}
        />
        <Path
          d="M30 18 L29 29 L25 25.4 L21 32 L17 24.8 L20.5 19 L15 17 Z"
          fill={GREEN}
        />
        <Path
          d="M10 31 L0 25 L6 22.5 L2 16 L11 16 L14.5 22 L20 19 Z"
          fill={GREEN}
        />
      </G>
 
      {/* coda stile dino */}
      <Px x={0} y={86} w={24} h={10} fill={SHADE} />
      <Px x={18} y={92} w={30} h={10} fill={MID} />
      <Px x={42} y={98} w={30} h={10} fill={WHITE} />
      <Px x={66} y={104} w={18} h={10} fill={WHITE} />
 
      {/* corpo */}
      <Px x={72} y={74} w={54} h={12} fill="url(#trashDinoWhite)" />
      <Px x={60} y={86} w={78} h={12} fill={WHITE} />
      <Px x={54} y={98} w={90} h={12} fill={WHITE} />
      <Px x={60} y={110} w={78} h={12} fill={MID} />
      <Px x={72} y={122} w={48} h={12} fill={SHADE} />
 
      {/* pancia luminosa */}
      <Px x={78} y={86} w={30} h={8} fill={LIGHT} opacity={0.65} />
      <Px x={84} y={98} w={24} h={8} fill={LIGHT} opacity={0.42} />
 
      {/* collo */}
      <Px x={108} y={62} w={24} h={12} fill={WHITE} />
      <Px x={114} y={54} w={18} h={12} fill={WHITE} />
 
      {/* testa laterale */}
      <Px x={120} y={30} w={48} h={12} fill={WHITE} />
      <Px x={114} y={42} w={66} h={12} fill={WHITE} />
      <Px x={114} y={54} w={78} h={12} fill={WHITE} />
      <Px x={120} y={66} w={54} h={12} fill={MID} />
 
      {/* muso */}
      <Px x={174} y={48} w={24} h={12} fill={WHITE} />
      <Px x={168} y={60} w={18} h={12} fill={MID} />
 
      {/* occhio */}
      <Px x={156} y={42} w={6} h={6} fill="#111827" />
 
      {/* bocca */}
      <Px x={174} y={66} w={12} h={4} fill={DARK} opacity={0.55} />
 
      {/* braccino */}
      <Px x={132} y={84} w={24} h={6} fill={MID} />
      <Px x={150} y={90} w={12} h={6} fill={SHADE} />
 
      {/* spallaccio nero davanti */}
      <Path
        d="M72 74 C94 72 116 82 132 99"
        stroke="#05070A"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity={0.92}
      />
 
      {/* piccolo accento verde, più elegante delle foglie */}
      <Path
        d="M126 30 C119 16 104 16 96 27 C106 36 118 37 126 30 Z"
        fill={GREEN_DARK}
      />
      <Path
        d="M136 29 C143 16 158 17 166 28 C155 36 144 37 136 29 Z"
        fill={GREEN}
        opacity={0.9}
      />
 
      {/* ombre pixel */}
      <Px x={60} y={122} w={60} h={4} fill={DARK} opacity={0.35} />
      <Px x={120} y={66} w={54} h={4} fill={DARK} opacity={0.24} />
    </Svg>
  );
}
 
const MINI_GAME_SESSION_RECORD = {
  bestTime: 0,
  bestScore: 0,
};
 
function PlantRunner({ playCrashSfx, text }) {
  const { width, height } = useWindowDimensions();
  const stageHeight = Math.min(388, Math.max(332, height * 0.43));
 
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
 
  const isJumping = useRef(false);
  const isPressingJumpRef = useRef(false);
  const dragonJumpYRef = useRef(0);
  const dragonVelocityYRef = useRef(0);
  const jumpHoldElapsedRef = useRef(0);
  const isTouchActiveRef = useRef(false);
  const jumpBufferRef = useRef(false);
  const jumpBufferTimeRef = useRef(0);
 
  const [isMiniRunning, setIsMiniRunning] = useState(false);
  const [isMiniGameOver, setIsMiniGameOver] = useState(false);
  const [miniScore, setMiniScore] = useState(0);
  const [miniObstacleScore, setMiniObstacleScore] = useState(0);
  const [miniBestTime, setMiniBestTime] = useState(MINI_GAME_SESSION_RECORD.bestTime);
  const [miniBestScore, setMiniBestScore] = useState(MINI_GAME_SESSION_RECORD.bestScore);
  const [miniObstacles, setMiniObstacles] = useState([]);
 
  const isMiniRunningRef = useRef(false);
  const isMiniGameOverRef = useRef(false);
  const miniObstaclesRef = useRef([]);
  const miniSpeedRef = useRef(96);
  const miniElapsedRef = useRef(0);
  const miniObstacleScoreRef = useRef(0);
  const miniBestTimeRef = useRef(MINI_GAME_SESSION_RECORD.bestTime);
  const miniBestScoreRef = useRef(MINI_GAME_SESSION_RECORD.bestScore);
  const miniLastFrameRef = useRef(null);
  const miniFrameRef = useRef(null);
  const miniSpawnTimerRef = useRef(null);
  const miniObstacleIdRef = useRef(0);
  const miniStageWidthRef = useRef(width);
 
  const DRAGON_LEFT = 18;
  const DRAGON_WIDTH = 86;
  const LONG_JUMP_Y = -148;
  const JUMP_START_VELOCITY = -242;
  const APEX_DESCENT_VELOCITY_HELD = 72;
  const APEX_DESCENT_VELOCITY_RELEASED = 170;
  const HOLD_MAX_SECONDS = 0.72;
  const HOLD_GRAVITY = 330;
  const RELEASE_GRAVITY = 930;
  const HOLD_BOOST_ACCELERATION = -620;
  const MAX_RISE_SPEED = -390;
  const MAX_FALL_SPEED = 610;
  const SHORT_TAP_FALL_MULTIPLIER = 1.32;
  const GROUND_READY_Y = -10;
  const JUMP_BUFFER_MS = 280;
 
  useEffect(() => {
    miniStageWidthRef.current = width;
  }, [width]);
 
  useEffect(() => {
    stepAnim.setValue(0);
 
    const stepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(stepAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(stepAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
 
    stepLoop.start();
 
    return () => {
      stepLoop.stop();
    };
  }, [stepAnim]);
 
  const setDragonJumpY = (nextY) => {
    dragonJumpYRef.current = nextY;
    jumpAnim.setValue(nextY);
  };
 
  const syncMiniSessionRecords = (timeValue = miniElapsedRef.current, scoreValue = miniObstacleScoreRef.current) => {
    const safeTime = Math.max(0, Math.floor(timeValue));
    const safeScore = Math.max(0, Math.floor(scoreValue));
 
    if (safeTime > miniBestTimeRef.current) {
      miniBestTimeRef.current = safeTime;
      MINI_GAME_SESSION_RECORD.bestTime = safeTime;
      setMiniBestTime(safeTime);
    }
 
    if (safeScore > miniBestScoreRef.current) {
      miniBestScoreRef.current = safeScore;
      MINI_GAME_SESSION_RECORD.bestScore = safeScore;
      setMiniBestScore(safeScore);
    }
  };
 
  const resetJumpPhysics = ({ keepJumpBuffer = false } = {}) => {
    isJumping.current = false;
    isPressingJumpRef.current = false;
    dragonVelocityYRef.current = 0;
    jumpHoldElapsedRef.current = 0;
 
    if (!keepJumpBuffer) {
      jumpBufferRef.current = false;
      jumpBufferTimeRef.current = 0;
    }
 
    setDragonJumpY(0);
  };
 
  const clearMiniGameTimers = () => {
    if (miniSpawnTimerRef.current) {
      clearTimeout(miniSpawnTimerRef.current);
      miniSpawnTimerRef.current = null;
    }
 
    if (miniFrameRef.current) {
      cancelAnimationFrame(miniFrameRef.current);
      miniFrameRef.current = null;
    }
  };
 
  const endMiniGame = () => {
    if (!isMiniRunningRef.current) return;
 
    clearMiniGameTimers();
    syncMiniSessionRecords(miniElapsedRef.current, miniObstacleScoreRef.current);
 
    isMiniRunningRef.current = false;
    isMiniGameOverRef.current = true;
    isPressingJumpRef.current = false;
    isTouchActiveRef.current = false;
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    setIsMiniRunning(false);
    setIsMiniGameOver(true);
 
    if (typeof playCrashSfx === "function") {
      playCrashSfx();
    }
  };
 
  const spawnObstacle = () => {
    if (!isMiniRunningRef.current) return;
 
    const height = 24 + Math.floor(Math.random() * 18);
    const obstacle = {
      id: miniObstacleIdRef.current + 1,
      x: miniStageWidthRef.current + 48,
      width: 16 + Math.floor(Math.random() * 11),
      height,
      scored: false,
      color: ["#475569", "#64748B", "#F59E0B"][miniObstacleIdRef.current % 3],
    };
 
    miniObstacleIdRef.current += 1;
    miniObstaclesRef.current = [...miniObstaclesRef.current, obstacle];
    setMiniObstacles(miniObstaclesRef.current);
 
    const isEarlyGame = miniElapsedRef.current < 18;
    const isMidGame = miniElapsedRef.current < 35;
    const baseDelay = isEarlyGame ? 2350 : isMidGame ? 2050 : 1820;
    const minimumDelay = isEarlyGame ? 1580 : isMidGame ? 1260 : 1040;
    const randomOffset = Math.floor(
      Math.random() * (isEarlyGame ? 240 : isMidGame ? 310 : 380)
    );
    const nextDelay = Math.max(
      minimumDelay,
      baseDelay - miniElapsedRef.current * 10 - randomOffset
    );
 
    miniSpawnTimerRef.current = setTimeout(spawnObstacle, nextDelay);
  };
 
  const triggerBufferedJumpIfNeeded = () => {
    const hasRecentBufferedJump =
      jumpBufferRef.current &&
      Date.now() - jumpBufferTimeRef.current <= JUMP_BUFFER_MS;
 
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    if (!hasRecentBufferedJump) return;
    if (!isMiniRunningRef.current || isMiniGameOverRef.current) return;
 
    requestAnimationFrame(() => {
      startJumpHold();
 
      if (!isTouchActiveRef.current) {
        requestAnimationFrame(() => {
          finishJumpHold();
        });
      }
    });
  };
 
  const updateJumpPhysics = (deltaSeconds) => {
    if (!isJumping.current) return;
 
    let currentY = dragonJumpYRef.current;
    let currentVelocity = dragonVelocityYRef.current;
 
    const canHoldBoost =
      isPressingJumpRef.current &&
      jumpHoldElapsedRef.current < HOLD_MAX_SECONDS &&
      currentY > LONG_JUMP_Y;
 
    if (canHoldBoost) {
      jumpHoldElapsedRef.current += deltaSeconds;
      currentVelocity += (HOLD_GRAVITY + HOLD_BOOST_ACCELERATION) * deltaSeconds;
      currentVelocity = Math.max(currentVelocity, MAX_RISE_SPEED);
    } else {
      const releaseGravity =
        jumpHoldElapsedRef.current < 0.12
          ? RELEASE_GRAVITY * SHORT_TAP_FALL_MULTIPLIER
          : RELEASE_GRAVITY;
      currentVelocity += releaseGravity * deltaSeconds;
    }
 
    currentVelocity = Math.min(currentVelocity, MAX_FALL_SPEED);
    currentY += currentVelocity * deltaSeconds;
 
    if (currentY <= LONG_JUMP_Y) {
      currentY = LONG_JUMP_Y;
      currentVelocity = isPressingJumpRef.current
        ? APEX_DESCENT_VELOCITY_HELD
        : APEX_DESCENT_VELOCITY_RELEASED;
    }
 
    if (currentY >= 0) {
      resetJumpPhysics({ keepJumpBuffer: true });
      triggerBufferedJumpIfNeeded();
      return;
    }
 
    dragonVelocityYRef.current = currentVelocity;
    setDragonJumpY(currentY);
  };
 
  const updateMiniGame = (timestamp) => {
    if (!isMiniRunningRef.current) return;
 
    if (!miniLastFrameRef.current) {
      miniLastFrameRef.current = timestamp;
    }
 
    const deltaSeconds = Math.min((timestamp - miniLastFrameRef.current) / 1000, 0.05);
    miniLastFrameRef.current = timestamp;
 
    updateJumpPhysics(deltaSeconds);
 
    miniElapsedRef.current += deltaSeconds;
    miniSpeedRef.current = Math.min(232, 96 + Math.max(0, miniElapsedRef.current - 2) * 4.8);
 
    let passedObstaclesThisFrame = 0;
    const scoreLineX = DRAGON_LEFT + 8;
 
    const movedObstacles = miniObstaclesRef.current
      .map((obstacle) => {
        const nextX = obstacle.x - miniSpeedRef.current * deltaSeconds;
        const hasJustPassed = !obstacle.scored && nextX + obstacle.width < scoreLineX;
 
        if (hasJustPassed) {
          passedObstaclesThisFrame += 1;
        }
 
        return {
          ...obstacle,
          x: nextX,
          scored: obstacle.scored || hasJustPassed,
        };
      })
      .filter((obstacle) => obstacle.x > -50);
 
    miniObstaclesRef.current = movedObstacles;
    setMiniObstacles(movedObstacles);
 
    const currentTime = Math.floor(miniElapsedRef.current);
    setMiniScore(currentTime);
 
    const dragonLeft = DRAGON_LEFT + 26;
    const dragonRight = DRAGON_LEFT + DRAGON_WIDTH - 10;
 
    const hasCollision = movedObstacles.some((obstacle) => {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const horizontalHit = obstacleRight > dragonLeft && obstacleLeft < dragonRight;
      const obstacleClearanceY = -(obstacle.height + 12);
      const dragonIsTooLow = dragonJumpYRef.current > obstacleClearanceY;
 
      return horizontalHit && dragonIsTooLow;
    });
 
    if (passedObstaclesThisFrame > 0) {
      const nextObstacleScore = miniObstacleScoreRef.current + passedObstaclesThisFrame;
      miniObstacleScoreRef.current = nextObstacleScore;
      setMiniObstacleScore(nextObstacleScore);
      syncMiniSessionRecords(currentTime, nextObstacleScore);
    } else {
      syncMiniSessionRecords(currentTime, miniObstacleScoreRef.current);
    }
 
    if (hasCollision) {
      endMiniGame();
      return;
    }
 
    miniFrameRef.current = requestAnimationFrame(updateMiniGame);
  };
 
  const startMiniGame = () => {
    clearMiniGameTimers();
 
    miniElapsedRef.current = 0;
    miniSpeedRef.current = 96;
    miniLastFrameRef.current = null;
    miniObstacleIdRef.current = 0;
    miniObstacleScoreRef.current = 0;
    miniObstaclesRef.current = [];
 
    resetJumpPhysics();
 
    isMiniRunningRef.current = true;
    isMiniGameOverRef.current = false;
    miniBestTimeRef.current = MINI_GAME_SESSION_RECORD.bestTime;
    miniBestScoreRef.current = MINI_GAME_SESSION_RECORD.bestScore;
 
    setMiniScore(0);
    setMiniObstacleScore(0);
    setMiniBestTime(MINI_GAME_SESSION_RECORD.bestTime);
    setMiniBestScore(MINI_GAME_SESSION_RECORD.bestScore);
    setMiniObstacles([]);
    setIsMiniRunning(true);
    setIsMiniGameOver(false);
 
    miniSpawnTimerRef.current = setTimeout(spawnObstacle, 1750);
    miniFrameRef.current = requestAnimationFrame(updateMiniGame);
  };
 
  const startJumpHold = () => {
    const isAlmostOnGround = dragonJumpYRef.current >= GROUND_READY_Y;
 
    if (isJumping.current && !isAlmostOnGround) {
      jumpBufferRef.current = true;
      jumpBufferTimeRef.current = Date.now();
      return;
    }
 
    if (isJumping.current && isAlmostOnGround) {
      resetJumpPhysics();
    }
 
    jumpBufferRef.current = false;
    jumpBufferTimeRef.current = 0;
 
    isJumping.current = true;
    isPressingJumpRef.current = true;
    jumpHoldElapsedRef.current = 0;
    dragonVelocityYRef.current = JUMP_START_VELOCITY;
    setDragonJumpY(0);
  };
 
  const finishJumpHold = () => {
    isTouchActiveRef.current = false;
 
    if (jumpBufferRef.current) {
      return;
    }
 
    isPressingJumpRef.current = false;
  };
 
  const handleDragonPressIn = () => {
    isTouchActiveRef.current = true;
    playGlobalButtonSfx();
 
    if (!isMiniRunningRef.current || isMiniGameOverRef.current) {
      startMiniGame();
    }
 
    startJumpHold();
  };
 
  const handleDragonPressOut = () => {
    finishJumpHold();
  };
 
  useEffect(() => {
    return () => {
      clearMiniGameTimers();
    };
  }, []);
 
  const bodyBob = stepAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 0],
  });
 
  const bodyLean = stepAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-1deg", "1deg", "-1deg"],
  });
 
  const shadowScale = jumpAnim.interpolate({
    inputRange: [LONG_JUMP_Y, 0],
    outputRange: [0.54, 1],
    extrapolate: "clamp",
  });
 
  const shadowOpacity = jumpAnim.interpolate({
    inputRange: [LONG_JUMP_Y, 0],
    outputRange: [0.08, 0.3],
    extrapolate: "clamp",
  });
 
  return (
    <TouchableOpacity
      activeOpacity={1}
      delayPressIn={0}
      delayPressOut={0}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      pressRetentionOffset={{ top: 80, bottom: 80, left: 80, right: 80 }}
      onPressIn={handleDragonPressIn}
      onPressOut={handleDragonPressOut}
      style={[styles.plantRunnerStage, { height: stageHeight }]}
    >
      <View pointerEvents="none" style={styles.plantRunnerGroundLine} />
 
      <View pointerEvents="none" style={styles.miniRunnerBestStatsBox}>
        <Text allowFontScaling={false} style={styles.miniRunnerBestStatsText}>
          {text.miniBestTime}: {miniBestTime}s
        </Text>
        <Text allowFontScaling={false} style={styles.miniRunnerBestStatsText}>
          {text.miniBestScore}: {miniBestScore}
        </Text>
      </View>
 
      <View pointerEvents="none" style={styles.miniRunnerLiveStatsBox}>
        <Text allowFontScaling={false} style={styles.miniRunnerLiveStatsText}>
          {text.miniTime}: {miniScore}s
        </Text>
        <Text allowFontScaling={false} style={styles.miniRunnerLiveStatsText}>
          {text.miniPoints}: {miniObstacleScore}
        </Text>
      </View>
 
      {!isMiniRunning && !isMiniGameOver && (
        <Text allowFontScaling={false} style={styles.miniRunnerStartHint}>
          {text.miniStartHint}
        </Text>
      )}
 
      {isMiniGameOver && (
        <View pointerEvents="none" style={styles.miniRunnerGameOverBadge}>
          <Text allowFontScaling={false} style={styles.miniRunnerGameOverTitle}>
            GAME OVER
          </Text>
          <Text allowFontScaling={false} style={styles.miniRunnerGameOverText}>
            {miniScore}s • {miniObstacleScore} pt • {text.miniRestartHint}
          </Text>
        </View>
      )}
 
      {miniObstacles.map((obstacle) => (
        <View
          key={obstacle.id}
          pointerEvents="none"
          style={[
            styles.miniRunnerObstacle,
            {
              left: obstacle.x,
              width: obstacle.width,
              height: obstacle.height,
              backgroundColor: obstacle.color,
            },
          ]}
        />
      ))}
 
      <Animated.View
        pointerEvents="none"
        style={[
          styles.runnerGroundShadow,
          {
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScale }],
          },
        ]}
      />
 
      <View pointerEvents="none" style={styles.miniRunnerDragonTouchArea}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.plantRunnerCharacter,
            {
              transform: [{ translateY: jumpAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.runnerDinoBodyWrap,
              {
                transform: [
                  { translateY: bodyBob },
                  { rotate: bodyLean },
                ],
              },
            ]}
          >
            <Image
              source={RUNNER_DRAGON_IMAGE}
              style={styles.runnerDragonImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}
function TreeComponent({ errors, activeTree, language, performanceMode = false, feedback = null }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const isDead = errors >= 2;
  const hasPremiumCosmeticEffect = Number(activeTree?.cost || 0) >= 270;
  const isTopTierCosmetic = ["flower_nebula", "coral_garden", "crystal_bloom"].includes(activeTree?.id);
  const premiumStroke = isDead ? "#94A3B8" : activeTree?.borderColor || "#FDE68A";
  const premiumAccent = isDead ? "#64748B" : activeTree?.accent || "#FDE68A";

  const ambientConfigs = useRef(
    Array.from({ length: performanceMode ? 0 : 10 }, (_, index) => ({
      left: 8 + ((index * 19) % 86),
      top: 18 + ((index * 13) % 58),
      duration: 2300 + (index % 5) * 260,
      delay: (index % 6) * 140,
      drift: isDead ? 16 + (index % 3) * 10 : -16 - (index % 3) * 8,
      glyph: isDead ? ["💧", "◆", "▴"][index % 3] : ["🍃", "✦", "❋"][index % 3],
    }))
  ).current;

  const ambient = useRef(ambientConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (performanceMode) {
      pulseAnim.setValue(0);
      ambient.forEach((value) => value.setValue(0));
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const ambientRuns = ambient.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(ambientConfigs[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: ambientConfigs[index].duration,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ])
      )
    );

    const animation = Animated.parallel([pulse, ...ambientRuns]);
    animation.start();

    return () => animation.stop();
  }, [errors, activeTree.id, performanceMode]);

  useEffect(() => {
    if (!feedback?.id) return;

    feedbackAnim.setValue(0);
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]).start();
  }, [feedback?.id]);

  const auraOpacity = performanceMode
    ? isDead
      ? 0.18
      : 0.24
    : pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.16, isDead ? 0.28 : 0.48],
      });

  const auraScale = performanceMode
    ? 1
    : pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.06],
      });

  const feedbackScale = feedbackAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, feedback?.type === "correct" ? 1.07 : 0.98, 1],
  });

  const feedbackTranslateX = feedbackAnim.interpolate({
    inputRange: [0, 0.18, 0.36, 0.54, 0.72, 1],
    outputRange: [0, feedback?.type === "wrong" ? -8 : 0, feedback?.type === "wrong" ? 8 : 0, feedback?.type === "wrong" ? -5 : 0, feedback?.type === "wrong" ? 5 : 0, 0],
  });

  const feedbackHaloOpacity = feedbackAnim.interpolate({
    inputRange: [0, 0.2, 0.75, 1],
    outputRange: [0, 0.62, 0.24, 0],
  });

  const particleStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    opacity: animVal.interpolate({
      inputRange: [0, 0.2, 0.75, 1],
      outputRange: [0, isDead ? 0.45 : 0.78, isDead ? 0.22 : 0.44, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.drift],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [isDead ? -8 : 16, isDead ? 40 : -28],
        }),
      },
      {
        rotate: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", config.drift > 0 ? "180deg" : "-180deg"],
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.treeCard,
        styles.cinTreeCard,
        {
          backgroundColor: isDead ? activeTree.bgDead : activeTree.bgAlive || activeTree.bgHealthy,
          borderColor: isDead ? "#64748B" : activeTree.borderColor,
          borderWidth: 3,
          transform: [{ translateX: feedbackTranslateX }, { scale: feedbackScale }],
        },
      ]}
    >
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 138" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="cinTreeShade" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDead ? "#1E121A" : "#052E1A"} stopOpacity="0.9" />
            <Stop offset="0.55" stopColor={isDead ? "#334155" : "#14532D"} stopOpacity="0.35" />
            <Stop offset="1" stopColor="#020617" stopOpacity="0.82" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="360" height="138" rx="22" fill="url(#cinTreeShade)" />
        <Path
          d="M-40 86 C70 34 138 118 225 64 C278 30 328 62 410 28"
          stroke={isDead ? "#94A3B8" : "#86EFAC"}
          strokeWidth="3"
          opacity="0.25"
          fill="none"
        />
        <Path
          d="M-30 116 C90 78 182 154 390 88"
          stroke={isDead ? "#64748B" : "#BBF7D0"}
          strokeWidth="2"
          opacity="0.12"
          fill="none"
        />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.cinTreeAura,
          {
            opacity: auraOpacity,
            transform: [{ scale: auraScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.treeFeedbackHalo,
          {
            opacity: feedbackHaloOpacity,
            backgroundColor:
              feedback?.type === "wrong"
                ? "rgba(239, 68, 68, 0.34)"
                : "rgba(34, 197, 94, 0.34)",
          },
        ]}
      />

      {hasPremiumCosmeticEffect && (
        <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 138" preserveAspectRatio="none" pointerEvents="none">
          <Path
            d="M18 33 C74 10 123 45 170 24 C221 1 274 34 340 14"
            stroke={premiumStroke}
            strokeWidth={isTopTierCosmetic ? "2.8" : "2"}
            opacity={isDead ? "0.14" : isTopTierCosmetic ? "0.38" : "0.26"}
            fill="none"
          />
          <Path
            d="M30 111 C88 88 126 116 178 98 C233 78 286 106 330 82"
            stroke={premiumAccent}
            strokeWidth={isTopTierCosmetic ? "2.4" : "1.8"}
            opacity={isDead ? "0.12" : isTopTierCosmetic ? "0.3" : "0.2"}
            fill="none"
          />
          <Circle cx="78" cy="32" r={isTopTierCosmetic ? "3.4" : "2.4"} fill={premiumAccent} opacity={isDead ? "0.28" : "0.72"} />
          <Circle cx="286" cy="38" r={isTopTierCosmetic ? "3.2" : "2.2"} fill="#FFFFFF" opacity={isDead ? "0.2" : "0.58"} />
          <Circle cx="303" cy="96" r={isTopTierCosmetic ? "3" : "2"} fill={premiumStroke} opacity={isDead ? "0.24" : "0.58"} />
          {isTopTierCosmetic && (
            <>
              <Circle cx="139" cy="23" r="2.4" fill="#FFFFFF" opacity={isDead ? "0.18" : "0.62"} />
              <Circle cx="218" cy="108" r="2.6" fill={premiumAccent} opacity={isDead ? "0.18" : "0.54"} />
            </>
          )}
        </Svg>
      )}

      {!performanceMode && (
        <View pointerEvents="none" style={styles.cinTreeParticleLayer}>
          {ambient.map((value, index) => (
            <Animated.Text
              key={index}
              allowFontScaling={false}
              pointerEvents="none"
              style={[styles.cinTreeParticle, particleStyle(value, ambientConfigs[index])]}
            >
              {ambientConfigs[index].glyph}
            </Animated.Text>
          ))}
        </View>
      )}

      <Text allowFontScaling={false} style={styles.treeMoodText}>
        {getShopItemMood(activeTree, language, isDead)}
      </Text>

      <View style={styles.treeGraphicsContainer}>
        <CosmeticVisual
          item={activeTree}
          variant={isDead ? "defeat" : "base"}
          size={78}
          emojiStyle={styles.mainTreeEmoji}
          animated={!performanceMode}
        />
      </View>
    </Animated.View>
  );
}
 
const BACKGROUND_MUSIC_SOURCE = require("./Slow_Afternoon_Ceremony_2_LU.mp3");
 
const BACKGROUND_MUSIC_MENU_VOLUME = 0.0650;
const BACKGROUND_MUSIC_GAMEPLAY_VOLUME = 0.015;
 
const MUSIC_DISABLED_SCREENS = ["auth", "login", "register"];
 
const SFX_SOURCES = {
  button: require("./td_sfx_button.wav"),
  pick: require("./td_sfx_pick.wav"),
  release: require("./td_sfx_release.wav"),
  correct: require("./td_sfx_correct.wav"),
  wrong: require("./td_sfx_wrong.wav"),
};
 
const SFX_VOLUMES = {
  button: 0.28,
  pick: 0.30,
  release: 0.26,
  correct: 0.34,
  wrong: 0.64,
};


// ============================================================================
// INTEGRAZIONE BACKEND TRASHDASH
// ============================================================================
const DEFAULT_GUEST_NAMES = new Set(["Ospite", "Guest"]);

function normalizeLanguageCode(value) {
  if (value === "EN" || value === "English") return "English";
  return "Italiano";
}

function languageToBackend(value) {
  return value === "English" ? "EN" : "IT";
}

function normalizeLobbyCode(value) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.startsWith("TD-")) return raw;
  if (raw.startsWith("TD")) return `TD-${raw.slice(2)}`;
  return `TD-${raw}`;
}

function usernameFromEmail(email) {
  const base = String(email || "")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : `EcoUser${Math.floor(1000 + Math.random() * 9000)}`;
}

function resolveCapitalCity(region, locality) {
  const normalizedRegion = normalizeItalianRegion(region);
  if (normalizedRegion && ITALIAN_REGION_CAPITALS[normalizedRegion]) return ITALIAN_REGION_CAPITALS[normalizedRegion];
  return locality || "Standard";
}

function normalizeCountryCode(value) {
  const country = String(value || "").trim().toUpperCase();
  if (country === "ITALY" || country === "ITALIA") return "IT";
  return country;
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = null;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export default function App() {
  // 1. PRIMA DICHIARIAMO TUTTI GLI STATI
  const [screen, setScreen] = useState("auth");
  const [coins, setCoins] = useState(0);
  const [difficulty, setDifficulty] = useState("Facile");
  const [language, setLanguage] = useState("Italiano");
  const [showLangMenu, setShowLangMenu] = useState(false);
 
  const [points, setPoints] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(60);
  const [wasteIndex, setWasteIndex] = useState(0);
  const [currentGameWastes, setCurrentGameWastes] = useState(EASY_WASTES);
  const [gameErrors, setGameErrors] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [treeFeedback, setTreeFeedback] = useState(null);
  const [dragInProgress, setDragInProgress] = useState(false);
 
  const [paused, setPaused] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
 
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const [localization, setLocalization] = useState(false);
  const [locationConsentMode, setLocationConsentMode] = useState(LOCATION_CONSENT.unset);
  const [locationPromptSeen, setLocationPromptSeen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [activeBins, setActiveBins] = useState(BINS);
  const [activeWastePools, setActiveWastePools] = useState(buildWastePoolsForBins(BINS));
  const [activeRuleSet, setActiveRuleSet] = useState(null);
  const [geoArea, setGeoArea] = useState(null);
  const [locationStatus, setLocationStatus] = useState("UNI 11686");
 
  const [shopItems, setShopItems] = useState(INITIAL_SHOP_ITEMS);
  const [equippedTreeId, setEquippedTreeId] = useState("tree_green");
 
  const [lobbyCode, setLobbyCode] = useState("");
  const [lobbyStatus, setLobbyStatus] = useState("");
  const [inputLobbyCode, setInputLobbyCode] = useState("");
  const [gameMode, setGameMode] = useState("SINGLE");
  const [activeLobbyCode, setActiveLobbyCode] = useState("");
  const [battleRole, setBattleRole] = useState(null);
  const [battleLobby, setBattleLobby] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [battleWaitingResult, setBattleWaitingResult] = useState(false);


  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardGuestPosition, setLeaderboardGuestPosition] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const catalogBinsCacheRef = useRef(new Map());
  const catalogWasteCacheRef = useRef(new Map());
  const locationRequestInProgressRef = useRef(false);

 
// 2. POI INSERIAMO I RIFERIMENTI E LE LOGICHE AUDIO
const backgroundMusicRef = useRef(null);
const previousScreenRef = useRef(screen);
 
const [musicReadyTick, setMusicReadyTick] = useState(0);
 
const getMusicTargetVolume = () => {
  if (!music || MUSIC_DISABLED_SCREENS.includes(screen)) {
    return 0;
  }
 
  if (screen === "gameplay") {
    return BACKGROUND_MUSIC_GAMEPLAY_VOLUME;
  }
 
  return BACKGROUND_MUSIC_MENU_VOLUME;
};
 
const startMenuMusicImmediately = () => {
  const sound = backgroundMusicRef.current;
 
  if (!music || !sound) return;
 
  previousScreenRef.current = "menu";
 
  sound
    .setStatusAsync({
      shouldPlay: true,
      isLooping: true,
      positionMillis: 0,
      volume: BACKGROUND_MUSIC_MENU_VOLUME,
    })
    .catch((error) => {
      console.log("Errore avvio immediato musica menu:", error);
    });
};
 
const goToMenuWithInstantMusic = () => {
  startMenuMusicImmediately();
  setScreen("menu");
};

const handleMusicChange = (value) => {
  setMusic(value);

  const sound = backgroundMusicRef.current;
  if (!sound) return;

  if (!value) {
    sound.pauseAsync().catch((error) => {
      console.log("Errore spegnimento musica:", error);
    });
    return;
  }

  if (MUSIC_DISABLED_SCREENS.includes(screen)) return;

  sound
    .setStatusAsync({
      shouldPlay: true,
      isLooping: true,
      volume: screen === "gameplay" ? BACKGROUND_MUSIC_GAMEPLAY_VOLUME : BACKGROUND_MUSIC_MENU_VOLUME,
    })
    .catch((error) => {
      console.log("Errore accensione musica:", error);
    });
};
 
useEffect(() => {
  let isMounted = true;
 
  async function preloadMusic() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        BACKGROUND_MUSIC_SOURCE,
       {
  shouldPlay: true,
  isLooping: true,
  volume: 0,
}
      );
 
      if (!isMounted) {
        await sound.unloadAsync();
        return;
      }
 
      backgroundMusicRef.current = sound;
      setMusicReadyTick((value) => value + 1);
    } catch (error) {
      console.log("Errore preload musica:", error);
    }
  }
 
  preloadMusic();
 
  return () => {
    isMounted = false;
 
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.unloadAsync();
      backgroundMusicRef.current = null;
    }
  };
}, []);
 
useEffect(() => {
  async function syncMusicWithScreen() {
    const sound = backgroundMusicRef.current;
 
    if (!sound) return;
 
    const musicMustBeSilent = !music || MUSIC_DISABLED_SCREENS.includes(screen);
    const targetVolume = getMusicTargetVolume();
 
    const previousScreen = previousScreenRef.current;
    const wasInSilentScreen = MUSIC_DISABLED_SCREENS.includes(previousScreen);
    const isEnteringMenuFromSilentScreen =
      wasInSilentScreen && screen === "menu" && music;
 
    try {
     if (musicMustBeSilent) {
  await sound.setVolumeAsync(0);
 
  if (!music) {
    await sound.pauseAsync();
  } else {
    await sound.setIsLoopingAsync(true);
 
    const silentStatus = await sound.getStatusAsync();
 
    if (silentStatus.isLoaded && !silentStatus.isPlaying) {
      await sound.playAsync();
    }
  }
 
  previousScreenRef.current = screen;
  return;
}
 
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(targetVolume);
 
      if (isEnteringMenuFromSilentScreen) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        previousScreenRef.current = screen;
        return;
      }
 
      const status = await sound.getStatusAsync();
 
      if (status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
      }
 
      previousScreenRef.current = screen;
    } catch (error) {
      console.log("Errore gestione musica:", error);
    }
  }
 
  syncMusicWithScreen();
}, [music, screen, musicReadyTick]);
 
const activeSfxRef = useRef({
  button: [],
  pick: [],
  release: [],
  correct: [],
  wrong: [],
});
 
const sfxReadyPromiseRef = useRef(null);
const sfxEnabledRef = useRef(sfx);
 
const gameplaySfxDirectorRef = useRef({
  token: 0,
  releaseTimer: null,
  lastWasteKey: null,
  lastAction: null,
});
 
useEffect(() => {
  sfxEnabledRef.current = sfx;
}, [sfx]);
 
const GAMEPLAY_SFX_KEYS = ["pick", "release", "correct", "wrong"];
 
const ensureSfxReady = async () => {
  if (sfxReadyPromiseRef.current) {
    return sfxReadyPromiseRef.current;
  }
 
  sfxReadyPromiseRef.current = Asset.loadAsync(Object.values(SFX_SOURCES)).catch((error) => {
    console.log("Errore preload asset SFX:", error);
  });
 
  return sfxReadyPromiseRef.current;
};
 
const removeActiveSfx = (trackKey, sound) => {
  const list = activeSfxRef.current[trackKey] || [];
  activeSfxRef.current[trackKey] = list.filter((item) => item !== sound);
};
 
const unloadSfxSafely = async (trackKey, sound) => {
  try {
    removeActiveSfx(trackKey, sound);
    sound.setOnPlaybackStatusUpdate(null);
    await sound.unloadAsync().catch(() => {});
  } catch (error) {
    console.log(`Errore unload SFX ${trackKey}:`, error);
  }
};
 
useEffect(() => {
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  }).catch((error) => {
    console.log("Errore modalità audio:", error);
  });
 
  ensureSfxReady();
 
  return () => {
    if (gameplaySfxDirectorRef.current.releaseTimer) {
      clearTimeout(gameplaySfxDirectorRef.current.releaseTimer);
      gameplaySfxDirectorRef.current.releaseTimer = null;
    }
 
    Object.entries(activeSfxRef.current).forEach(([trackKey, sounds]) => {
      sounds.forEach((sound) => {
        unloadSfxSafely(trackKey, sound);
      });
    });
 
    activeSfxRef.current = {
      button: [],
      pick: [],
      release: [],
      correct: [],
      wrong: [],
    };
  };
}, []);
 
const playSfx = async (key, options = {}) => {
  if (!sfxEnabledRef.current) return;
  if (!SFX_SOURCES[key]) return;
 
  const trackKey = options.trackKey || key;
  const token = options.token ?? null;
 
  try {
    await ensureSfxReady();
 
    if (token !== null && token !== gameplaySfxDirectorRef.current.token) return;
    if (!sfxEnabledRef.current) return;
 
    const { sound } = await Audio.Sound.createAsync(SFX_SOURCES[key], {
      shouldPlay: false,
      volume: SFX_VOLUMES[key] ?? 0.18,
      progressUpdateIntervalMillis: 80,
    });
 
    if (token !== null && token !== gameplaySfxDirectorRef.current.token) {
      await sound.unloadAsync().catch(() => {});
      return;
    }
 
    if (!activeSfxRef.current[trackKey]) {
      activeSfxRef.current[trackKey] = [];
    }
 
    activeSfxRef.current[trackKey].push(sound);
 
    let alreadyCleaned = false;
 
    const cleanup = () => {
      if (alreadyCleaned) return;
      alreadyCleaned = true;
      unloadSfxSafely(trackKey, sound);
    };
 
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status?.didJustFinish) {
        cleanup();
      }
    });
 
    await sound.setStatusAsync({
      shouldPlay: true,
      positionMillis: 0,
      volume: SFX_VOLUMES[key] ?? 0.18,
      isMuted: false,
    });
 
    setTimeout(cleanup, 2500);
  } catch (error) {
    console.log(`Errore play SFX ${key}:`, error);
  }
};
 
const playSfxInstant = (key, options = {}) => {
  playSfx(key, options);
};
 
const stopSfx = async (key) => {
  const sounds = [...(activeSfxRef.current[key] || [])];
 
  activeSfxRef.current[key] = [];
 
  await Promise.all(
    sounds.map(async (sound) => {
      try {
        sound.setOnPlaybackStatusUpdate(null);
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      } catch (error) {
        console.log(`Errore stop SFX ${key}:`, error);
      }
    })
  );
};
 
const stopGameplaySfx = async () => {
  await Promise.all(GAMEPLAY_SFX_KEYS.map((key) => stopSfx(key)));
};
 
const clearGameplayReleaseTimer = () => {
  if (gameplaySfxDirectorRef.current.releaseTimer) {
    clearTimeout(gameplaySfxDirectorRef.current.releaseTimer);
    gameplaySfxDirectorRef.current.releaseTimer = null;
  }
};
 
const resetGameplaySfxDirector = async () => {
  clearGameplayReleaseTimer();
 
  gameplaySfxDirectorRef.current.token += 1;
  gameplaySfxDirectorRef.current.lastWasteKey = null;
  gameplaySfxDirectorRef.current.lastAction = null;
 
  await stopGameplaySfx();
  await ensureSfxReady();
};
 
const prepareSfxForGameplay = async () => {
  if (!sfxEnabledRef.current) return;
 
  await ensureSfxReady();
  await stopGameplaySfx();
};
 
const getCurrentWasteAudioKey = () => {
  return `${difficulty}-${wasteIndex}-${currentWaste?.name || "unknown"}-${currentWaste?.type || "unknown"}`;
};
 
const gameplaySfxDirector = (eventName, payload = {}) => {
  if (!sfxEnabledRef.current) return;
 
  const director = gameplaySfxDirectorRef.current;
  const wasteAudioKey = getCurrentWasteAudioKey();
 
  director.token += 1;
  const currentToken = director.token;
 
  if (director.lastWasteKey !== wasteAudioKey) {
    director.lastWasteKey = wasteAudioKey;
    director.lastAction = null;
    clearGameplayReleaseTimer();
  }
 
  if (eventName === "pick") {
    clearGameplayReleaseTimer();
 
    director.lastAction = "pick";
 
    stopSfx("release");
    stopSfx("correct");
    stopSfx("wrong");
 
    playSfxInstant("pick", {
      trackKey: "pick",
      token: currentToken,
    });
 
    return;
  }
 
  if (eventName === "release") {
    clearGameplayReleaseTimer();
 
    director.lastAction = "release_pending";
 
    gameplaySfxDirectorRef.current.releaseTimer = setTimeout(() => {
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
      if (gameplaySfxDirectorRef.current.lastAction !== "release_pending") return;
 
      stopSfx("pick");
      stopSfx("correct");
      stopSfx("wrong");
 
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
      playSfxInstant("release", {
        trackKey: "release",
        token: currentToken,
      });
 
      gameplaySfxDirectorRef.current.lastAction = "release_played";
    }, 70);
 
    return;
  }
 
  if (eventName === "correct" || eventName === "wrong") {
    clearGameplayReleaseTimer();
 
    director.lastAction = eventName;
 
    stopGameplaySfx().then(() => {
      if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
      setTimeout(() => {
        if (currentToken !== gameplaySfxDirectorRef.current.token) return;
 
        playSfxInstant(eventName, {
          trackKey: eventName,
          token: currentToken,
        });
      }, 25);
    });
 
    return;
  }
 
  playSfxInstant(eventName);
};
 
useEffect(() => {
  globalButtonSfxHandler = () => {
    playSfxInstant("button", {
      trackKey: "button",
    });
  };
 
  return () => {
    globalButtonSfxHandler = null;
  };
}, []);
 
const withButtonSfx = (callback) => {
  return (...args) => {
    playSfxInstant("button", {
      trackKey: "button",
    });
 
    if (typeof callback === "function") {
      callback(...args);
    }
  };
};
 
const playSoundEffect = (isCorrect, selectedBinId) => {
  gameplaySfxDirector(isCorrect ? "correct" : "wrong", {
    selectedBinId,
    correctBinId: currentWaste?.type,
    wasteName: currentWaste?.name,
    wasteIndex,
    difficulty,
  });
};
 
const activeTree = useMemo(() => {
  return shopItems.find((item) => item.id === equippedTreeId) || shopItems[0];
}, [shopItems, equippedTreeId]);
 
const currentWaste = currentGameWastes[wasteIndex];
 
const text = TRANSLATIONS[language] || TRANSLATIONS.Italiano;

const normalizeLocationConsentMode = (value) => {
  if (value === LOCATION_CONSENT.once) return LOCATION_CONSENT.always;
  if (Object.values(LOCATION_CONSENT).includes(value)) return value;
  return LOCATION_CONSENT.unset;
};

const getLocationConsentStorageKey = (profile = currentUser) => {
  if (!profile || profile.isGuest || profile.id === "guest") return STORAGE_KEYS.guestLocationConsent;
  return `${STORAGE_KEYS.userLocationConsentPrefix}${profile.id}`;
};

const readLocationConsent = async (profile = currentUser) => {
  try {
    const raw = await AsyncStorage.getItem(getLocationConsentStorageKey(profile));
    if (!raw) return LOCATION_CONSENT.unset;
    const parsed = JSON.parse(raw);
    return normalizeLocationConsentMode(parsed?.mode || parsed);
  } catch {
    return LOCATION_CONSENT.unset;
  }
};

const writeLocationConsent = async (mode, profile = currentUser) => {
  const normalizedMode = normalizeLocationConsentMode(mode);
  await AsyncStorage.setItem(
    getLocationConsentStorageKey(profile),
    JSON.stringify({ mode: normalizedMode, updatedAt: new Date().toISOString() })
  );
};

const getDisplayUsername = (user = currentUser) => {
  if (!user) return text.currentGuest;
  if (user.isGuest && (!user.username || DEFAULT_GUEST_NAMES.has(user.username))) {
    return text.guestPlayer;
  }
  return user.username || text.currentGuest;
};

const localizeMessage = (message, fallback) => {
  const normalized = String(message || "").trim();
  const messageMap = {
    "Credenziali non valide": text.authInvalidCredentials,
    "Email o username già registrati": text.authEmailUsernameTaken,
    "Accesso non riuscito": text.authFailed,
    "Creazione lobby non riuscita": text.lobbyCreateFailed,
    "Ingresso lobby non riuscito": text.lobbyJoinFailed,
  };

  return messageMap[normalized] || normalized || fallback;
};

const getLocationModeLabel = () => {
  switch (locationConsentMode) {
    case LOCATION_CONSENT.always:
      return text.locationModeAlways;
    case LOCATION_CONSENT.never:
      return text.locationModeNever;
    default:
      return text.locationModeUnset;
  }
};

const getLocalizedLocationStatus = () => {
  const explicitStatusPattern = /permesso|permission|gps|fuori italia|outside italy|regione non riconosciuta|region not recognized|non disponibile|unavailable/i;
  const translatedExplicitStatus = (() => {
    if (/permesso.*negato|permission.*denied/i.test(locationStatus)) return text.locationPermissionDeniedStatus;
    if (/gps.*non disponibile|gps.*unavailable/i.test(locationStatus)) return text.locationGpsUnavailableStatus;
    if (/fuori italia|outside italy/i.test(locationStatus)) return text.locationOutsideItalyStatus;
    if (/regione non riconosciuta|region not recognized/i.test(locationStatus)) return text.locationRegionUnknownStatus;
    if (/localizzazione non disponibile|location unavailable|non disponibile|unavailable/i.test(locationStatus)) return text.locationUnavailableStatus;
    return "";
  })();

  if (!localization) {
    if (explicitStatusPattern.test(locationStatus)) return translatedExplicitStatus || locationStatus;
    return text.locationStandardStatus || "Standard nazionale: UNI 11686";
  }

  if (locationStatus === "UNI 11686") {
    return text.locationStandardStatus || "Standard nazionale: UNI 11686";
  }

  if (/localizzazione in corso|detecting location/i.test(locationStatus)) {
    return text.locationInProgressStatus || locationStatus;
  }

  if (/posizione rilevata|aggiorno regole|location detected|updating rules/i.test(locationStatus)) {
    return text.locationUpdatingRulesStatus || locationStatus;
  }

  if (/regole locali offline|offline local rules/i.test(locationStatus)) {
    const match = locationStatus.match(/:\s*(.+)$/);
    return match?.[1]
      ? `${text.locationOfflineRulesPrefix || "Regole locali offline"}: ${match[1]}`
      : text.locationOfflineRulesPrefix || locationStatus;
  }

  if (/regole standard offline|standard rules offline/i.test(locationStatus)) {
    const areaLabel = locationStatus.split("-")[0]?.trim();
    const suffix = text.locationStandardOfflineSuffix || "regole standard offline";
    return areaLabel ? `${areaLabel} - ${suffix}` : text.locationStandardStatus || locationStatus;
  }

  if (/regole standard|standard rules/i.test(locationStatus)) {
    const areaLabel = locationStatus.split("-")[0]?.trim();
    const suffix = text.locationStandardRulesSuffix || "regole standard";
    return areaLabel ? `${areaLabel} - ${suffix}` : text.locationStandardStatus || locationStatus;
  }

  if (explicitStatusPattern.test(locationStatus)) {
    return translatedExplicitStatus || locationStatus;
  }

  if (activeRuleSet && !activeRuleSet.isDefault) {
    return `${activeRuleSet.capitalCity} (${activeRuleSet.region})`;
  }

  if (geoArea?.region && geoArea?.capitalCity) {
    return `${geoArea.capitalCity} (${geoArea.region})`;
  }

  if (/posizione rilevata|location detected/i.test(locationStatus)) {
    return text.locationUpdatingRulesStatus || locationStatus;
  }

  return locationStatus;
};

const applyBackendProfile = async (payload, tokenValue = authToken) => {
  const profile = payload?.user || payload;
  if (!profile) return;

  const settings = profile.settings || {};
  const purchasedIds = new Set((profile.purchases || []).map((purchase) => purchase.itemId));
  purchasedIds.add("tree_green");

  setCurrentUser({ ...profile, isGuest: false });
  setCoins(profile.coins ?? 0);
  setShopItems((prev) =>
    prev.map((item) => ({
      ...item,
      bought: purchasedIds.has(item.id),
    }))
  );

  if (typeof settings.music === "boolean") setMusic(settings.music);
  if (typeof settings.sfx === "boolean") setSfx(settings.sfx);
  if (settings.language) setLanguage(normalizeLanguageCode(settings.language));
  if (settings.equippedItemId) setEquippedTreeId(settings.equippedItemId);

  const profileForConsent = { ...profile, isGuest: false };
  const storedConsentMode = await readLocationConsent(profileForConsent);
  const hasStoredConsent = storedConsentMode !== LOCATION_CONSENT.unset;
  const hasSeenLocationPrompt = settings.locationPromptSeen === true || hasStoredConsent;
  const effectiveConsentMode = hasStoredConsent
    ? storedConsentMode
    : hasSeenLocationPrompt
    ? settings.localization === true
      ? LOCATION_CONSENT.always
      : LOCATION_CONSENT.never
    : LOCATION_CONSENT.unset;

  setLocationConsentMode(effectiveConsentMode);
  setLocationPromptSeen(hasSeenLocationPrompt);
  setShowLocationPrompt(!hasSeenLocationPrompt);
  setLocalization(
    effectiveConsentMode === LOCATION_CONSENT.always ||
      (hasSeenLocationPrompt && settings.localization === true)
  );

  if (tokenValue && hasStoredConsent && settings.locationPromptSeen !== true) {
    apiRequest("/me/settings", {
      method: "PUT",
      token: tokenValue,
      body: {
        localization: effectiveConsentMode !== LOCATION_CONSENT.never,
        locationPromptSeen: true,
      },
    }).catch((error) => console.log("Sync prompt localizzazione non riuscito:", error.message));
  }

  if (tokenValue) {
    setAuthToken(tokenValue);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, tokenValue],
      [STORAGE_KEYS.user, JSON.stringify(profile)],
    ]);
  }
};

const applyGuestProfile = (profile = {}) => {
  const guestName = profile.username || text.guestPlayer || "Ospite";

  setAuthToken(null);

  setCurrentUser({
    id: "guest",
    username: guestName,
    isGuest: true,
    totalScore: 0,
  });

  // Tutti i valori collegati all'ospite partono da zero.
  setCoins(0);
  setPoints(0);
  setLives(3);
  setTime(60);
  setWasteIndex(0);
  setGameErrors([]);
  setGameResult(null);
  setTreeFeedback(null);
  setPaused(false);
  setConfirmAbandon(false);
  setDragInProgress(false);

  // L'ospite parte sempre solo con l'albero verde base.
  setEquippedTreeId("tree_green");
  setShopItems((prev) =>
    prev.map((item) => ({
      ...item,
      bought: item.id === "tree_green",
    }))
  );

  // Reset valori temporanei ospite.
  setLobbyCode("");
  setLobbyStatus("");
  setInputLobbyCode("");
  setGameMode("SINGLE");
  setActiveLobbyCode("");
  setBattleRole(null);
  setBattleLobby(null);
  setBattleResult(null);
  setBattleWaitingResult(false);

  // Localizzazione ospite spenta e non bloccante.
  setLocalization(false);
  setLocationConsentMode(LOCATION_CONSENT.unset);
  setLocationPromptSeen(false);
  setShowLocationPrompt(true);
  setGeoArea(null);
  setLocationStatus("UNI 11686");
  setActiveBins(BINS);
  setActiveWastePools(buildWastePoolsForBins(BINS));

  // Non cambio lingua quando si entra come ospite.
  setMusic(profile.music ?? true);
  setSfx(profile.sfx ?? true);
};

const persistGuestProfile = async () => {
  if (!currentUser?.isGuest) return;

  // L'ospite è una sessione temporanea:
  // può giocare, guadagnare e comprare durante la sessione,
  // ma nulla viene conservato dopo uscita/disconnessione.
  await AsyncStorage.removeItem(STORAGE_KEYS.guestProfile);
};

useEffect(() => {
  let mounted = true;

  async function restoreSession() {
    try {
      // TrashDash deve partire sempre da Accesso/Registrazione.
      // Tolgo token e utente salvati per evitare ingresso automatico nel menu.
      // Mantengo invece la memoria della scelta localizzazione.
      await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);

      if (mounted) {
        setAuthToken(null);
        setCurrentUser(null);
        setLanguage("Italiano");
        setLocalization(false);
        setLocationPromptSeen(false);
        setGeoArea(null);
        setLocationStatus("UNI 11686");
        setActiveBins(BINS);
        setActiveWastePools(buildWastePoolsForBins(BINS));
        setScreen("auth");
      }
    } catch (error) {
      console.log("Reset sessione iniziale non riuscito:", error.message);
    } finally {
      if (mounted) setSessionRestored(true);
    }
  }

  restoreSession();
  return () => {
    mounted = false;
  };
}, []);

useEffect(() => {
  if (!sessionRestored || !currentUser?.isGuest) return;
  persistGuestProfile().catch((error) => console.log("Salvataggio guest non riuscito:", error.message));
}, [sessionRestored, currentUser, coins, equippedTreeId, language, music, sfx, localization, locationConsentMode, shopItems]);

useEffect(() => {
  if (!sessionRestored || !authToken || currentUser?.isGuest) return;

  const timer = setTimeout(() => {
    apiRequest("/me/settings", {
      method: "PUT",
      token: authToken,
      body: {
        music,
        sfx,
        localization,
        locationPromptSeen,
        language: languageToBackend(language),
        equippedItemId: equippedTreeId,
      },
    }).catch((error) => console.log("Sync impostazioni non riuscita:", error.message));
  }, 450);

  return () => clearTimeout(timer);
}, [sessionRestored, authToken, currentUser, music, sfx, localization, locationPromptSeen, language, equippedTreeId]);

const mergeRemoteBins = (items = []) => {
  const remoteById = new Map(items.map((item) => [item.id, item]));
  const merged = BINS.map((bin) => {
    const remote = remoteById.get(bin.id);
    if (!remote) return bin;
    return {
      ...bin,
      label: remote.label || bin.label,
      color: remote.color || bin.color,
      textColor: remote.textColor || bin.textColor,
      localColor: remote.localColor,
      note: remote.note,
      sourceUrl: remote.sourceUrl,
    };
  });

  return decorateBinsForLocalRules(merged);
};

const applyCatalogWastePools = async (params, bins) => {
  const cacheKey = params || "default";
  const cachedItems = catalogWasteCacheRef.current.get(cacheKey);

  if (cachedItems) {
    setActiveWastePools(groupCatalogWastesByDifficulty(cachedItems, bins));
    return;
  }

  try {
    const result = await apiRequest(`/catalog/wastes${params}`, { timeoutMs: 8000 });
    if (Array.isArray(result.items) && result.items.length > 0) {
      catalogWasteCacheRef.current.set(cacheKey, result.items);
      setActiveWastePools(groupCatalogWastesByDifficulty(result.items, bins));
      return;
    }
  } catch (error) {
    console.log("Catalogo rifiuti non disponibile:", error.message);
  }

  setActiveWastePools(buildWastePoolsForBins(bins));
};

const loadCatalogRules = async (area = null, { statusMessage } = {}) => {
  const params = area?.region && area?.capitalCity
    ? `?region=${encodeURIComponent(area.region)}&capitalCity=${encodeURIComponent(area.capitalCity)}`
    : "";
  const cacheKey = params || "default";
  const localFallback = getLocalRuleFallback(area);

  try {
    let result = catalogBinsCacheRef.current.get(cacheKey);

    if (!result) {
      result = await apiRequest(`/catalog/bins${params}`, { timeoutMs: 8000 });
      catalogBinsCacheRef.current.set(cacheKey, result);
    }

    if (area && localFallback && (!result.ruleSet || result.ruleSet.isDefault)) {
      const fallbackBins = mergeRemoteBins(localFallback.items || []);
      setActiveBins(fallbackBins);
      setActiveWastePools(buildWastePoolsForBins(fallbackBins));
      setActiveRuleSet(localFallback.ruleSet);
      setLocationStatus(
        statusMessage ||
          `${text.locationOfflineRulesPrefix || "Regole locali offline"}: ${localFallback.ruleSet.capitalCity} (${localFallback.ruleSet.region})`
      );
      return { ...localFallback, localFallback: true };
    }

    const mergedBins = mergeRemoteBins(result.items || []);
    setActiveBins(mergedBins);
    setActiveRuleSet(result.ruleSet || null);
    await applyCatalogWastePools(params, mergedBins);

    if (statusMessage) {
      setLocationStatus(statusMessage);
    } else if (result.ruleSet && !result.ruleSet.isDefault) {
      setLocationStatus(`${result.ruleSet.capitalCity} (${result.ruleSet.region})`);
    } else if (area?.region && area?.capitalCity) {
      setLocationStatus(`${area.capitalCity} (${area.region}) - ${text.locationStandardRulesSuffix || "regole standard"}`);
    } else {
      setLocationStatus("UNI 11686");
    }

    return result;
  } catch (error) {
    console.log("Catalogo regole non disponibile:", error.message);

    if (localFallback) {
      const fallbackBins = mergeRemoteBins(localFallback.items || []);
      setActiveBins(fallbackBins);
      setActiveWastePools(buildWastePoolsForBins(fallbackBins));
      setActiveRuleSet(localFallback.ruleSet);
      setLocationStatus(
        statusMessage ||
          `${text.locationOfflineRulesPrefix || "Regole locali offline"}: ${localFallback.ruleSet.capitalCity} (${localFallback.ruleSet.region})`
      );
      return { ...localFallback, offline: true, localFallback: true };
    }

    setActiveBins(BINS);
    setActiveWastePools(buildWastePoolsForBins(BINS));
    setActiveRuleSet(null);

    if (statusMessage) {
      setLocationStatus(statusMessage);
    } else if (area?.region && area?.capitalCity) {
      setLocationStatus(`${area.capitalCity} (${area.region}) - ${text.locationStandardOfflineSuffix || "regole standard offline"}`);
    } else {
      setLocationStatus("UNI 11686");
    }

    return { ruleSet: null, items: BINS, offline: true };
  }
};

const getLocationPermission = async () => {
  try {
    return await Location.getForegroundPermissionsAsync();
  } catch (error) {
    console.log("Controllo permesso posizione non riuscito:", error.message);
    return { status: "denied", canAskAgain: false };
  }
};

const setStandardRules = async (message = "UNI 11686") => {
  setGeoArea(null);
  setLocationStatus(message);
  await loadCatalogRules(null, { statusMessage: message });
};

const loadNationalLocationRules = async (message = "UNI 11686") => {
  setGeoArea(null);
  setLocationStatus(message);
  await loadCatalogRules(null, { statusMessage: message });
};

const getDevicePosition = async ({ highAccuracy = false } = {}) => {
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: highAccuracy,
      }),
      LOCATION_REQUEST_TIMEOUT_MS,
      "Timeout rilevamento posizione"
    );
  } catch (error) {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: LOCATION_LAST_KNOWN_MAX_AGE_MS,
      requiredAccuracy: 1000,
    }).catch(() => null);

    if (lastKnown?.coords) {
      return lastKnown;
    }

    throw error;
  }
};

const mapExpoGeocodeResult = (item = {}) => {
  return resolveItalianAreaFromGeocodePayload({
    countryCode: item.isoCountryCode || item.countryCode || item.country,
    country: item.country,
    principalSubdivision: item.region,
    region: item.region,
    subregion: item.subregion,
    county: item.subregion,
    city: item.city,
    locality: item.locality,
    district: item.district,
    name: item.name,
  });
};

const reverseGeocodeCoordinates = async (latitude, longitude) => {
  const localResults = await Location.reverseGeocodeAsync({ latitude, longitude }).catch((error) => {
    console.log("Reverse geocode dispositivo non disponibile:", error.message);
    return [];
  });

  if (localResults?.[0]) {
    const localGeo = mapExpoGeocodeResult(localResults[0]);
    if (localGeo?.outsideItaly || localGeo?.region || localGeo?.principalSubdivision) {
      return localGeo;
    }
    console.log("Reverse geocode dispositivo senza regione italiana riconosciuta, provo backend.");
  }

  try {
    const backendGeo = await reverseGeocodeWithBigDataCloud(
      latitude,
      longitude,
      language === "English" ? "en" : "it"
    );
    const resolvedBackendGeo = resolveItalianAreaFromGeocodePayload(backendGeo);
    if (resolvedBackendGeo?.outsideItaly || resolvedBackendGeo?.region || resolvedBackendGeo?.principalSubdivision) {
      return resolvedBackendGeo;
    }
  } catch (error) {
    console.log("Reverse geocode backend non disponibile:", error.message);
  }

  return null;
};

const tryApplyDeviceLocationRules = async ({ requestPermission = false } = {}) => {
  try {
    if (requestPermission) {
      locationRequestInProgressRef.current = true;
    }

    let permission = await getLocationPermission();

    if (permission.status !== "granted" && requestPermission) {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (permission.status !== "granted") {
      if (requestPermission) {
        setLocalization(false);
        setLocationConsentMode(LOCATION_CONSENT.never);
        await writeLocationConsent(LOCATION_CONSENT.never).catch(() => {});
      }
      await loadNationalLocationRules(text.locationPermissionDeniedStatus || "Permesso posizione negato: uso standard UNI 11686");
      return false;
    }

    let servicesEnabled = await Location.hasServicesEnabledAsync();

    if (!servicesEnabled && requestPermission && typeof Location.enableNetworkProviderAsync === "function") {
      await Location.enableNetworkProviderAsync().catch((error) =>
        console.log("Richiesta attivazione GPS non riuscita:", error.message)
      );
      servicesEnabled = await Location.hasServicesEnabledAsync();
    }

    if (!servicesEnabled) {
      if (requestPermission) setLocalization(false);
      await loadNationalLocationRules(text.locationGpsUnavailableStatus || "GPS non disponibile: uso standard UNI 11686");
      return false;
    }

    setLocationStatus(text.locationInProgressStatus || "Localizzazione in corso...");

    const position = await getDevicePosition({ highAccuracy: requestPermission });
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    setLocationStatus(text.locationUpdatingRulesStatus || "Posizione rilevata: aggiorno regole...");

    const geo = await reverseGeocodeCoordinates(latitude, longitude);

    if (!geo) {
      setGeoArea({ latitude, longitude });
      await loadCatalogRules(null, { statusMessage: text.locationRegionUnknownStatus || "Regione non riconosciuta: uso standard UNI 11686" });
      return false;
    }

    if (geo.outsideItaly) {
      await loadNationalLocationRules(text.locationOutsideItalyStatus || "Fuori Italia: uso standard UNI 11686");
      return false;
    }

    const countryCode = normalizeCountryCode(geo.countryCode || geo.isoCountryCode || geo.country);

    if (countryCode && countryCode !== "IT") {
      await loadNationalLocationRules(text.locationOutsideItalyStatus || "Fuori Italia: uso standard UNI 11686");
      return false;
    }

    const region = normalizeItalianRegion(geo.principalSubdivision || geo.region || geo.subregion);

    if (!region) {
      setGeoArea({ latitude, longitude });
      await loadCatalogRules(null, { statusMessage: text.locationRegionUnknownStatus || "Regione non riconosciuta: uso standard UNI 11686" });
      return false;
    }

    const capitalCity = resolveCapitalCity(region, geo.city || geo.locality);
    const area = { region, capitalCity, latitude, longitude };

    setGeoArea(area);
    const appliedRules = await loadCatalogRules(area);
    return Boolean(appliedRules?.localFallback || (appliedRules?.ruleSet && !appliedRules.ruleSet.isDefault));
  } catch (error) {
    console.log("Localizzazione non riuscita:", error.message);
    await loadNationalLocationRules(text.locationUnavailableStatus || "Localizzazione non disponibile: uso standard UNI 11686").catch((fallbackError) =>
      console.log("Fallback regole nazionali non riuscito:", fallbackError.message)
    );
    return false;
  } finally {
    if (requestPermission) {
      locationRequestInProgressRef.current = false;
    }
  }
};

const syncLocationRules = async ({ forceEnabled = localization } = {}) => {
  if (locationRequestInProgressRef.current) {
    return true;
  }

  if (!forceEnabled) {
    await loadNationalLocationRules("UNI 11686");
    return false;
  }

  const applied = await tryApplyDeviceLocationRules({ requestPermission: false });
  if (!applied) setLocalization(false);
  return applied;
};

useEffect(() => {
  if (!sessionRestored) return;
  if (["auth", "login", "register"].includes(screen)) return;

  // Non apre mai popup permessi: aggiorna solo in base alla scelta già fatta.
  syncLocationRules({ forceEnabled: localization }).catch((error) =>
    console.log("Caricamento regole non riuscito:", error.message)
  );
}, [sessionRestored, screen, localization, language]);

const handleLocalizationToggle = async (value) => {
  await handleLocalizationChange(value);
};

const deactivateOneTimeLocalization = async () => {
  // Disattivato: la localizzazione è una scelta libera dell'utente.
  // Non viene più spenta automaticamente dalla scelta iniziale.
};

const persistLocationPromptDecision = async (enabled) => {
  if (!authToken || currentUser?.isGuest) return;

  await apiRequest("/me/settings", {
    method: "PUT",
    token: authToken,
    body: {
      localization: Boolean(enabled),
      locationPromptSeen: true,
    },
  }).catch((error) => console.log("Salvataggio scelta localizzazione non riuscito:", error.message));
};

const handleLocationConsentChoice = async (mode) => {
  const wantsLocation = mode === true || mode === "always" || mode === LOCATION_CONSENT.always;

  setShowLocationPrompt(false);
  setLocationPromptSeen(true);

  if (typeof setLocationConsentMode === "function") {
    setLocationConsentMode(wantsLocation ? LOCATION_CONSENT.always : LOCATION_CONSENT.never);
  }

  if (typeof writeLocationConsent === "function") {
    await writeLocationConsent(wantsLocation ? LOCATION_CONSENT.always : LOCATION_CONSENT.never).catch(() => {});
  }

  await handleLocalizationChange(wantsLocation);
};

const handleLocalizationChange = async (value) => {
  setShowLocationPrompt(false);
  setLocationPromptSeen(true);
  const nextConsentMode = value ? LOCATION_CONSENT.always : LOCATION_CONSENT.never;

  if (typeof setLocationConsentMode === "function" && typeof LOCATION_CONSENT !== "undefined") {
    setLocationConsentMode(nextConsentMode);
  }

  await writeLocationConsent(nextConsentMode).catch(() => {});

  if (!value) {
    setLocalization(false);
    await persistLocationPromptDecision(false);
    await loadNationalLocationRules("UNI 11686").catch((error) =>
      console.log("Ripristino regole UNI non riuscito:", error.message)
    );
    return;
  }

  setLocalization(true);
  setLocationStatus(text.locationCheckingPermissionStatus || "Localizzazione attiva: verifico permesso...");

  const applied = await tryApplyDeviceLocationRules({ requestPermission: true });
  await persistLocationPromptDecision(applied);
  setLocalization(applied);
};

useEffect(() => {
  // Nessuna disattivazione automatica: il giocatore decide sempre da Impostazioni.
}, []);

const handleAuthSubmit = async (isRegister) => {
  setAuthError("");
  setAuthSuccess("");

  const username = authUsername.trim();
  const email = authEmail.trim().toLowerCase();
  const password = authPassword;

  if (!isValidEmail(email)) {
    setAuthError(text.authInvalidEmail || "Inserisci un indirizzo email valido.");
    return;
  }

  if (isRegister && username.length < 3) {
    setAuthError(text.authUsernameShort || "Lo username deve contenere almeno 3 caratteri.");
    return;
  }

  if (isRegister && password.length < 8) {
    setAuthError(text.authPasswordShort || "La password deve contenere almeno 8 caratteri.");
    return;
  }

  if (!isRegister && password.length === 0) {
    setAuthError(text.authPasswordRequired || "Inserisci la password prima di premere Entra.");
    return;
  }

  try {
    if (isRegister) {
      await apiRequest("/auth/register", {
        method: "POST",
        body: { username, email, password },
      });

      setAuthPassword("");
      setAuthSuccess(text.authRegisterCompleteLogin || "Registrazione completata. Reinserisci la password e premi Entra.");
      setScreen("login");
      return;
    }

    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    await applyBackendProfile(result, result.token);

    startMenuMusicImmediately();
    setScreen("menu");
  } catch (error) {
    const message = error.message || "Operazione non riuscita";

    if (message.includes("Email o username")) {
      setAuthError(text.authEmailUsernameTakenLong || "Email o username già registrati. Usa Accesso oppure cambia dati.");
    } else if (message.includes("Credenziali")) {
      setAuthError(text.authInvalidCredentialsLong || "Email o password non corrette. Controlla i dati e riprova.");
    } else if (message.includes("Dati non validi")) {
      setAuthError(text.authInvalidData || "Controlla email, username e password: alcuni dati non sono validi.");
    } else {
      setAuthError(message);
    }
  }
};

const handleGuestAccess = async () => {
  const currentLanguageBeforeGuest = language;

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.guestProfile,
    STORAGE_KEYS.guestLocationConsent,
  ]);

  applyGuestProfile({});

  // Entra come ospite non deve mai cambiare lingua.
  setLanguage(currentLanguageBeforeGuest || "Italiano");

  startMenuMusicImmediately();
  setScreen("menu");
};

const handleLogout = async () => {
  await deactivateOneTimeLocalization();

  if (currentUser?.isGuest) {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.guestProfile,
      STORAGE_KEYS.guestLocationConsent,
    ]);

    setCoins(0);
    setPoints(0);
    setEquippedTreeId("tree_green");
    setShopItems((prev) =>
      prev.map((item) => ({
        ...item,
        bought: item.id === "tree_green",
      }))
    );
  }

  await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);

  setAuthToken(null);
  setCurrentUser(null);
  setAuthUsername("");
  setAuthEmail("");
  setAuthPassword("");
  setAuthError("");
  setAuthNotice("");
  setShowLocationPrompt(false);
  setLocalization(false);
  setLocationConsentMode(LOCATION_CONSENT.unset);
  setLocationPromptSeen(false);
  setGeoArea(null);
  setLocationStatus("UNI 11686");
  setBattleRole(null);
  setBattleLobby(null);
  setBattleResult(null);
  setActiveLobbyCode("");
  setLobbyCode("");
  setScreen("auth");
};

const handleExitApp = async () => {
  await deactivateOneTimeLocalization();

  if (currentUser?.isGuest) {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.guestProfile,
      STORAGE_KEYS.guestLocationConsent,
    ]);

    setCoins(0);
    setPoints(0);
    setEquippedTreeId("tree_green");
    setShopItems((prev) =>
      prev.map((item) => ({
        ...item,
        bought: item.id === "tree_green",
      }))
    );
  }

  BackHandler.exitApp();
};

const loadLeaderboard = async () => {
  setLeaderboardLoading(true);
  try {
    const guestScore = currentUser?.isGuest ? Math.max(0, currentUser.totalScore || 0) : 0;
    const guestScoreParam = guestScore > 0 ? `&guestScore=${encodeURIComponent(guestScore)}` : "";
    const result = await apiRequest(`/leaderboard?limit=10${guestScoreParam}`);
    setLeaderboardRows(result.items || []);
    setLeaderboardGuestPosition(result.guestPosition || null);
  } catch (error) {
    console.log("Leaderboard backend non disponibile:", error.message);
    setLeaderboardRows([]);
    setLeaderboardGuestPosition(null);
  } finally {
    setLeaderboardLoading(false);
  }
};

useEffect(() => {
  if (screen === "leaderboard") {
    loadLeaderboard();
  }
}, [screen, currentUser?.isGuest, currentUser?.totalScore]);

const submitGameResultToBackend = async (status, finalScore, mode = gameMode, livesOverride = lives) => {
  const backendStatus = status === "VITTORIA" ? "WIN" : status === "ABBANDONATA" ? "ABANDONED" : "LOSE";
  const durationSeconds = Math.max(0, (DIFFICULTY_SETTINGS[difficulty]?.time || 60) - time);
  const payload = {
    mode,
    difficulty,
    score: Math.max(0, finalScore),
    status: backendStatus,
    livesRemaining: livesOverride,
    durationSeconds,
    errors: gameErrors,
    region: geoArea?.region,
    capitalCity: geoArea?.capitalCity,
  };

  if (!authToken || currentUser?.isGuest) {
    setCurrentUser((prev) => prev ? {
      ...prev,
      totalScore: (prev.totalScore || 0) + Math.max(0, finalScore),
    } : prev);
    return null;
  }

  try {
    const result = await apiRequest("/games/submit", {
      method: "POST",
      token: authToken,
      body: payload,
    });
    if (result.user) await applyBackendProfile(result, authToken);
    return result;
  } catch (error) {
    console.log("Salvataggio partita non riuscito:", error.message);
    return null;
  }
};

const startBattleMatch = async (lobby, role) => {
  setBattleLobby(lobby);
  setBattleResult(null);
  setBattleWaitingResult(false);
  setActiveLobbyCode(lobby.code);
  setBattleRole(role);
  setLobbyStatus(text.statusBattleStarted);
  await startNewGame(lobby.difficulty || difficulty, { mode: "BATTLE", lobby, role });
};

const refreshBattleLobby = async (code) => {
  if (!code || !authToken) return null;
  const lobby = await apiRequest(`/lobbies/${code}`, { token: authToken });
  setBattleLobby(lobby);
  return lobby;
};

useEffect(() => {
  if (screen !== "battle" || battleRole !== "host" || !lobbyCode || !authToken) return;

  const interval = setInterval(async () => {
    try {
      const lobby = await refreshBattleLobby(lobbyCode);
      if (lobby?.status === "IN_PROGRESS") {
        clearInterval(interval);
        startBattleMatch(lobby, "host");
      } else if (lobby?.status === "EXPIRED") {
        setLobbyStatus(text.lobbyExpired);
      }
    } catch (error) {
      console.log("Polling lobby non riuscito:", error.message);
    }
  }, 1600);

  return () => clearInterval(interval);
}, [screen, battleRole, lobbyCode, authToken]);

useEffect(() => {
  if (screen !== "battleEnd" || !activeLobbyCode || !authToken) return;
  if (battleResult?.status === "FINISHED") return;

  let cancelled = false;

  const pollBattleResult = async () => {
    try {
      const lobby = await refreshBattleLobby(activeLobbyCode);
      if (cancelled || !lobby) return;

      if (lobby?.status === "FINISHED") {
        setBattleResult(lobby);
        setBattleWaitingResult(false);
      } else {
        setBattleWaitingResult(true);
      }
    } catch (error) {
      console.log("Polling risultato scontro non riuscito:", error.message);
    }
  };

  pollBattleResult();
  const interval = setInterval(pollBattleResult, 1600);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [screen, activeLobbyCode, authToken, battleResult?.status]);

const finishBattleMatch = async (finalScore, status, livesOverride = lives) => {
  setBattleWaitingResult(true);
  setScreen("battleEnd");
  await submitGameResultToBackend(status, finalScore, "BATTLE", livesOverride);

  if (!activeLobbyCode || !authToken) {
    setBattleWaitingResult(false);
    return;
  }

  try {
    const lobby = await apiRequest(`/lobbies/${activeLobbyCode}/finish`, {
      method: "POST",
      token: authToken,
      body: { score: Math.max(0, finalScore) },
    });
    setBattleLobby(lobby);
    if (lobby.status === "FINISHED") {
      setBattleResult(lobby);
      setBattleWaitingResult(false);
    } else {
      setBattleResult(null);
      setBattleWaitingResult(true);
    }
  } catch (error) {
    console.log("Chiusura scontro non riuscita:", error.message);
    setBattleWaitingResult(false);
  }
};
 
// FIX 1: Rimosso dragInProgress dalle dipendenze per non bloccare il timer
useEffect(() => {
  if (screen !== "gameplay" || paused || gameResult) return;
 
  const interval = setInterval(() => {
    setTime((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        triggerGameOver("SCONFITTA");
        return 0;
      }
 
      return prev - 1;
    });
  }, 1000);
 
  return () => clearInterval(interval);
}, [screen, paused, gameResult]);
 
const triggerGameOver = (status, scoreOverride = points, livesOverride = lives) => {
  const finalScore = Math.max(0, scoreOverride);
  setGameResult(status);
 
  if (status === "VITTORIA") {
    setCoins((currentCoins) => currentCoins + calculateCoinsEarned(status, finalScore, difficulty));
  }
 
  if (gameMode === "BATTLE") {
    finishBattleMatch(finalScore, status, livesOverride);
    return;
  }

  submitGameResultToBackend(status, finalScore, "SINGLE", livesOverride);
  setScreen("result");
};
 
const startNewGame = async (selectedLevel, options = {}) => {
  await resetGameplaySfxDirector();
  await prepareSfxForGameplay();
 
  const { config, wastes: newWasteSequence } = createGameSession(selectedLevel, activeWastePools);
 
  setGameMode(options.mode || "SINGLE");
  if (options.mode === "BATTLE" && options.lobby) {
    setActiveLobbyCode(options.lobby.code);
    setBattleLobby(options.lobby);
    setBattleRole(options.role || battleRole);
  } else {
    setActiveLobbyCode("");
    setBattleLobby(null);
    setBattleResult(null);
    setBattleWaitingResult(false);
  }

  setDifficulty(selectedLevel);
  setPoints(0);
  setLives(config.lives);
  setTime(config.time);
  setCurrentGameWastes(newWasteSequence);
  setWasteIndex(0);
  setGameErrors([]);
  setGameResult(null);
  setTreeFeedback(null);
  setPaused(false);
  setConfirmAbandon(false);
  setDragInProgress(false);
  setScreen("gameplay");
};
 
const handleWasteSorting = (selectedBinId) => {
  if (!currentWaste || gameResult) return;
 
  if (selectedBinId === currentWaste.type) {
    playSoundEffect(true, selectedBinId);
    setTreeFeedback({ id: Date.now(), type: "correct" });
 
    const addedPoints = 10 + Math.max(0, Math.floor(time / 8));
    const finalPoints = points + addedPoints;
    setPoints(finalPoints);
 
    if (wasteIndex >= currentGameWastes.length - 1) {
      triggerGameOver("VITTORIA", finalPoints, lives);
    } else {
      setWasteIndex((prev) => prev + 1);
    }
 
    return;
  }
 
  playSoundEffect(false, selectedBinId);
  setTreeFeedback({ id: Date.now(), type: "wrong" });
 
  const targetBin = activeBins.find((bin) => bin.id === currentWaste.type) || BINS.find((bin) => bin.id === currentWaste.type);
  const targetBinLabel = getBinDisplayLabel(targetBin, language, text);
  const displayedWasteName = getWasteName(currentWaste, language);
  const displayedWasteDescription = getWasteDescription(currentWaste, language);
  const nextLives = lives - 1;
 
  setGameErrors((prev) => [
    ...prev,
    {
      name: displayedWasteName,
      desc: `${text.wrongSortingPrefix} ${currentWaste.icon} ${displayedWasteName} ${text.wrongSortingMiddle} ${text.correctDestination}: ${targetBinLabel}. ${displayedWasteDescription}`,
    },
  ]);
 
  setLives(nextLives);
 
  if (nextLives <= 0) {
    triggerGameOver("SCONFITTA", points, nextLives);
  }
};
 
const handleGenerateLobby = async () => {
  if (!authToken || currentUser?.isGuest) {
    setLobbyStatus(text.loginRequiredCreate);
    return;
  }

  const battleDifficulty = normalizeBattleDifficulty(difficulty);
  if (battleDifficulty !== difficulty) setDifficulty(battleDifficulty);

  try {
    const created = await apiRequest("/lobbies", {
      method: "POST",
      token: authToken,
      body: { difficulty: battleDifficulty },
    });
    setLobbyCode(created.code);
    setBattleRole("host");
    setBattleLobby(created);
    setBattleResult(null);
    setActiveLobbyCode(created.code);
    setLobbyStatus(text.waitingOpponent);
  } catch (error) {
    setLobbyStatus(localizeMessage(error.message, text.lobbyCreateFailed));
  }
};
 
const handleJoinLobby = async () => {
  if (!authToken || currentUser?.isGuest) {
    setLobbyStatus(text.loginRequiredJoin);
    return;
  }

  const code = normalizeLobbyCode(inputLobbyCode);
  if (!code) return;

  try {
    const joined = await apiRequest(`/lobbies/${code}/join`, {
      method: "POST",
      token: authToken,
    });
    setLobbyCode(joined.code);
    setInputLobbyCode(joined.code);
    setBattleRole("guest");
    setBattleLobby(joined);
    setActiveLobbyCode(joined.code);
    setLobbyStatus(text.statusBattleStarted);
    await startBattleMatch(joined, "guest");
  } catch (error) {
    setLobbyStatus(localizeMessage(error.message, text.lobbyJoinFailed));
  }
};
 
  function AuthScreen({ isRegister }) {
  return (
    <ScreenShell muted>
      <View style={styles.innerAuthLayout}>
        <Text allowFontScaling={false} style={styles.brandTitle}>
          TrashDash
        </Text>
 
        <Text allowFontScaling={false} style={styles.brandSubtitle}>
          {text.subtitle}
        </Text>
 
        <View style={styles.authFormCard}>
          <Text allowFontScaling={false} style={styles.formHeadline}>
            {isRegister ? text.titleRegister : text.titleLogin}
          </Text>
 
          {isRegister && (
            <View style={styles.inputWrapper}>
              <Text allowFontScaling={false} style={styles.inputLabel}>
                {text.username}
              </Text>
              <TextInput
                style={styles.inputFieldMock}
                placeholder={text.usernamePlaceholder}
                placeholderTextColor="#999"
                value={authUsername}
                onChangeText={setAuthUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                returnKeyType="next"
                editable
              />
            </View>
          )}
 
          <View style={styles.inputWrapper}>
            <Text allowFontScaling={false} style={styles.inputLabel}>
              {text.email}
            </Text>
            <TextInput
              style={styles.inputFieldMock}
              placeholder={text.emailPlaceholder}
              placeholderTextColor="#999"
              value={authEmail}
              onChangeText={setAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              returnKeyType="next"
              editable
            />
          </View>
 
          <View style={styles.inputWrapper}>
            <Text allowFontScaling={false} style={styles.inputLabel}>
              {text.password}
            </Text>
            <TextInput
              style={styles.inputFieldMock}
              secureTextEntry
              placeholder={text.passwordPlaceholder}
              placeholderTextColor="#999"
              value={authPassword}
              onChangeText={setAuthPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType={isRegister ? "newPassword" : "none"}
              returnKeyType="done"
              editable
            />
          </View>
 
          <View style={styles.authButtonsRow}>
            <FancyButton
              small
              label={isRegister ? text.btnLogin : text.btnRegister}
              onPress={() => {
                setAuthError("");
                setAuthNotice("");
                setScreen(isRegister ? "login" : "register");
              }}
            />
           <FancyButton
  small
  active
  label={isRegister ? text.btnSendRegister : text.btnEnter}
  onPress={() => handleAuthSubmit(isRegister)}
/>
          </View>

          <View style={styles.authFeedbackArea}>
            {authError ? (
              <Text allowFontScaling={false} style={[styles.authFeedbackText, styles.authErrorText]}>
                {authError}
              </Text>
            ) : null}
            {authNotice ? (
              <Text allowFontScaling={false} style={[styles.authFeedbackText, styles.authNoticeText]}>
                {authNotice}
              </Text>
            ) : null}
          
          {authSuccess ? (
            <Text allowFontScaling={false} style={{ color: "#BBF7D0", textAlign: "center", marginTop: 8, fontWeight: "800" }}>
              {authSuccess}
            </Text>
          ) : null}
          </View>
 
        <TouchableOpacity onPress={withButtonSfx(handleGuestAccess)}>
            <Text allowFontScaling={false} style={styles.guestLinkText}>
              {text.guest}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
}

function LocationConsentPrompt() {
  const shouldShowLocationPrompt =
    screen === "menu" && Boolean(currentUser) && (showLocationPrompt || !locationPromptSeen);

  if (!shouldShowLocationPrompt) return null;

  return (
    <View style={styles.locationConsentOverlay}>
      <View style={styles.locationConsentCard}>
        <Text allowFontScaling={false} style={styles.locationConsentTitle}>
          {text.locationPromptTitle}
        </Text>
        <Text allowFontScaling={false} style={styles.locationConsentBody}>
          {text.locationPromptBody}
        </Text>

        <View style={styles.locationConsentButtonsColumn}>
          <FancyButton
            active
            label={text.locationAlways}
            onPress={() => handleLocationConsentChoice(true)}
            style={styles.locationConsentButton}
          />
          <FancyButton
            label={text.locationNever}
            onPress={() => handleLocationConsentChoice(false)}
            style={[styles.locationConsentButton, styles.locationConsentNeverButton]}
          />
        </View>
      </View>
    </View>
  );
}
 
 function MainMenuScreen() {
  const renderMenuButton = (label, onPress, secondary = false) => (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={withButtonSfx(onPress)}
      style={[
        styles.tdMenuButtonBase,
        secondary ? styles.tdMenuSecondaryButton : styles.tdMenuPrimaryButton,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.tdMenuButtonText,
          secondary ? styles.tdMenuSecondaryButtonText : styles.tdMenuPrimaryButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenShell muted={false}>
      <View pointerEvents="box-none" style={styles.tdMenuTopBar}>
        <Text allowFontScaling={false} style={styles.coinsCounterText}>
          {text.balance}: {coins} 🪙
        </Text>

        <PowerExitButton onPress={withButtonSfx(handleExitApp)} />
      </View>

      <View style={styles.tdMenuBodyPremium}>
        <Text allowFontScaling={false} style={styles.tdMenuLogoPremium}>
          TrashDash
        </Text>

        <View style={styles.tdMenuPrimaryGroup}>
          {renderMenuButton(text.btnContinue, () => startNewGame(difficulty))}
          {renderMenuButton(text.btnNewGame, () => setScreen("difficulty"))}
          {renderMenuButton(text.btnBattle, () => {
            setDifficulty((current) => normalizeBattleDifficulty(current));
            setScreen("battle");
          })}
          {renderMenuButton(text.btnLeaderboard, () => setScreen("leaderboard"))}
        </View>

        <View style={styles.tdMenuSecondaryRow}>
          {renderMenuButton(text.btnSettings, () => setScreen("settings"), true)}
          {renderMenuButton(text.btnShop, () => setScreen("shop"), true)}
        </View>
      </View>

      <LocationConsentPrompt />
    </ScreenShell>
  );
}
 
  function DifficultyScreen() {
  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <View style={[styles.centralPanel, styles.tdDifficultyPanel]}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.titleDifficulty}
        </Text>
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.easy}
          onPress={() => startNewGame("Facile")}
        />
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.medium}
          onPress={() => startNewGame("Medio")}
        />
 
        <FancyButton
          style={styles.diffSelectorBtn}
          label={text.hard}
          onPress={() => startNewGame("Difficile")}
        />
      </View>
 
      <PlantRunner text={text} playCrashSfx={() => playSfxInstant("wrong", { trackKey: "wrong" })} />
    </ScreenShell>
  );
}
  const GameplayScreen = useMemo(
    () =>
   function GameplayScreenComponent({
  lives,
  points,
  time,
  gameErrors,
  activeTree,
  currentWaste,
  treeFeedback,
  paused,
  confirmAbandon,
  setPaused,
  setConfirmAbandon,
  setDragInProgress,
  setScreen,
  handleWasteSorting,
  bins,
  text,
  language,
  playDragSfx,
}) {
        const pan = useRef(new Animated.ValueXY()).current;
        const dragScale = useRef(new Animated.Value(1)).current;
        const binRefs = useRef({});
        const binLayoutsRef = useRef({});
        const wasteStartCenter = useRef(null);
        const wasteMeasureRef = useRef(null);
        const dragTouchStart = useRef(null);
        const [isDragging, setIsDragging] = useState(false);
        const playDragSfxRef = useRef(playDragSfx);
        const dragReleaseLockRef = useRef(false);
        const dragSafetyTimerRef = useRef(null);
playDragSfxRef.current = playDragSfx;

        useEffect(() => {
          return () => {
            if (dragSafetyTimerRef.current) {
              clearTimeout(dragSafetyTimerRef.current);
              dragSafetyTimerRef.current = null;
            }
          };
        }, []);
 
        const currentWasteRef = useRef(currentWaste);
        const handleWasteSortingRef = useRef(handleWasteSorting);
 
        currentWasteRef.current = currentWaste;
        handleWasteSortingRef.current = handleWasteSorting;
 
        const clearDragSafetyTimer = () => {
          if (dragSafetyTimerRef.current) {
            clearTimeout(dragSafetyTimerRef.current);
            dragSafetyTimerRef.current = null;
          }
        };

        const finishDrag = () => {
          clearDragSafetyTimer();
          dragReleaseLockRef.current = false;
          setIsDragging(false);
          setDragInProgress(false);
          dragTouchStart.current = null;
          wasteStartCenter.current = null;
        };
 
        const resetDrag = () => {
          pan.stopAnimation();
          dragScale.stopAnimation();

          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 7,
              tension: 120,
              useNativeDriver: true,
            }),
            Animated.spring(dragScale, {
              toValue: 1,
              friction: 6,
              tension: 120,
              useNativeDriver: true,
            }),
          ]).start();
        };
 
        const distanceToRect = (pointX, pointY, rect) => {
          const dx = Math.max(rect.left - pointX, 0, pointX - rect.right);
          const dy = Math.max(rect.top - pointY, 0, pointY - rect.bottom);
          return Math.sqrt(dx * dx + dy * dy);
        };

        const isValidLayout = (layout) => {
          if (!layout) return false;
          return [layout.x, layout.y, layout.width, layout.height].every(
            (value) => typeof value === "number" && Number.isFinite(value)
          ) && layout.width > 0 && layout.height > 0;
        };

        const cacheBinLayout = (binId) => {
          const ref = binRefs.current[binId];
          if (!ref || !ref.measureInWindow) return;

          ref.measureInWindow((x, y, width, height) => {
            const layout = { x, y, width, height };
            if (isValidLayout(layout)) {
              binLayoutsRef.current[binId] = layout;
            } else {
              delete binLayoutsRef.current[binId];
            }
          });
        };

        const cacheAllBinLayouts = () => {
          Object.keys(binRefs.current).forEach(cacheBinLayout);
        };
 
        const getVisualObjectCenter = (gestureState) => {
          const safeGesture = gestureState || { dx: 0, dy: 0, moveX: 0, moveY: 0 };
          const wasteCalibration =
            WASTE_DROP_CALIBRATION[currentWasteRef.current?.name] ||
            DEFAULT_WASTE_DROP_CALIBRATION;
 
          if (wasteStartCenter.current) {
            return {
              x: wasteStartCenter.current.x + safeGesture.dx + wasteCalibration.anchorOffsetX,
              y: wasteStartCenter.current.y + safeGesture.dy + wasteCalibration.anchorOffsetY,
            };
          }
 
          if (dragTouchStart.current) {
            return {
              x: dragTouchStart.current.x + safeGesture.dx + wasteCalibration.anchorOffsetX,
              y: dragTouchStart.current.y + safeGesture.dy + wasteCalibration.anchorOffsetY,
            };
          }
 
          return {
            x: safeGesture.moveX + wasteCalibration.anchorOffsetX,
            y: safeGesture.moveY + wasteCalibration.anchorOffsetY,
          };
        };
 
        const resolveDropTarget = (gestureState) => {
          const wasteCalibration =
            WASTE_DROP_CALIBRATION[currentWasteRef.current?.name] ||
            DEFAULT_WASTE_DROP_CALIBRATION;

          const dropPoint = getVisualObjectCenter(gestureState);

          const probePoints = [
            { x: dropPoint.x, y: dropPoint.y, weight: wasteCalibration.mainWeight },
            { x: dropPoint.x - wasteCalibration.probeSpreadX, y: dropPoint.y, weight: 5 },
            { x: dropPoint.x + wasteCalibration.probeSpreadX, y: dropPoint.y, weight: 5 },
            { x: dropPoint.x, y: dropPoint.y - wasteCalibration.probeSpreadY, weight: 5 },
            { x: dropPoint.x, y: dropPoint.y + wasteCalibration.probeSpreadY, weight: 5 },
            {
              x: dropPoint.x - wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y - wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x + wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y - wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x - wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y + wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
            {
              x: dropPoint.x + wasteCalibration.probeSpreadX * 0.7,
              y: dropPoint.y + wasteCalibration.probeSpreadY * 0.7,
              weight: 3,
            },
          ];

          let completed = 0;
          let bestTarget = null;
          let bestScore = 0;
          let completedRelease = false;

          const evaluateBinLayout = (binId, layout) => {
            if (!isValidLayout(layout)) return;

            const { x, y, width, height } = layout;
            const calibration = BIN_DROP_CALIBRATION[binId] || BIN_DROP_CALIBRATION.secco;

            const exactRect = {
              left: x,
              right: x + width,
              top: y,
              bottom: y + height,
              centerX: x + width / 2,
              centerY: y + height / 2,
              width,
              height,
            };

            const expandedRect = {
              left: x - calibration.expandLeft,
              right: x + width + calibration.expandRight,
              top: y - calibration.expandTop,
              bottom: y + height + calibration.expandBottom,
              centerX: x + width / 2,
              centerY: y + height / 2,
              width,
              height,
            };

            let score = 0;

            const mainPointInsideExact =
              dropPoint.x >= exactRect.left &&
              dropPoint.x <= exactRect.right &&
              dropPoint.y >= exactRect.top &&
              dropPoint.y <= exactRect.bottom;

            if (mainPointInsideExact) {
              score += 120;
            }

            let exactProbeHits = 0;

            probePoints.forEach((point) => {
              const insideExact =
                point.x >= exactRect.left &&
                point.x <= exactRect.right &&
                point.y >= exactRect.top &&
                point.y <= exactRect.bottom;

              const insideExpanded =
                point.x >= expandedRect.left &&
                point.x <= expandedRect.right &&
                point.y >= expandedRect.top &&
                point.y <= expandedRect.bottom;

              if (insideExact) {
                exactProbeHits += 1;
                score += point.weight * 2.2;
              } else if (insideExpanded) {
                score += point.weight;
              }
            });

            const distance = distanceToRect(dropPoint.x, dropPoint.y, exactRect);

            if (distance <= calibration.magneticRadius) {
              score += (1 - distance / calibration.magneticRadius) * 14;
            }

            const isRealBinDrop =
              mainPointInsideExact ||
              exactProbeHits >= 2 ||
              (exactProbeHits >= 1 && distance <= 12);

            if (score > 0 && isRealBinDrop) {
              const centerDistance = Math.hypot(
                dropPoint.x - expandedRect.centerX,
                dropPoint.y - expandedRect.centerY
              );

              const maxCenterDistance = Math.max(
                Math.hypot(expandedRect.width / 2, expandedRect.height / 2),
                1
              );

              let finalScore =
                score +
                Math.max(0, 1 - centerDistance / maxCenterDistance) *
                  9 *
                  calibration.centerPower;

              if (binId === currentWasteRef.current?.type) {
                finalScore += 10;
                finalScore *= 1.08;
              }

              if (finalScore > bestScore) {
                bestScore = finalScore;
                bestTarget = binId;
              }
            }
          };

          const completeReleaseOnce = (target = bestTarget) => {
            if (completedRelease) return;
            completedRelease = true;
            clearDragSafetyTimer();

            resetDrag();
            finishDrag();

            if (target) {
              requestAnimationFrame(() => {
                handleWasteSortingRef.current(target);
              });
            }
          };

          const cachedEntries = Object.entries(binLayoutsRef.current).filter(([, layout]) =>
            isValidLayout(layout)
          );

          if (cachedEntries.length > 0) {
            cachedEntries.forEach(([binId, layout]) => evaluateBinLayout(binId, layout));
            completeReleaseOnce(bestTarget);
            return;
          }

          const entries = Object.entries(binRefs.current).filter(
            ([, ref]) => ref && ref.measureInWindow
          );

          const markMeasureCompleted = () => {
            completed += 1;
            if (completed >= entries.length) {
              completeReleaseOnce(bestTarget);
            }
          };

          if (entries.length === 0) {
            completeReleaseOnce(null);
            return;
          }

          dragSafetyTimerRef.current = setTimeout(() => {
            completeReleaseOnce(null);
          }, 140);

          entries.forEach(([binId, ref]) => {
            try {
              ref.measureInWindow((x, y, width, height) => {
                if (completedRelease) return;

                const layout = { x, y, width, height };

                if (isValidLayout(layout)) {
                  binLayoutsRef.current[binId] = layout;
                  evaluateBinLayout(binId, layout);
                } else {
                  delete binLayoutsRef.current[binId];
                }

                markMeasureCompleted();
              });
            } catch (error) {
              markMeasureCompleted();
            }
          });
        };
 
        const panResponder = useMemo(
          () =>
            PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onStartShouldSetPanResponderCapture: () => true,
              onMoveShouldSetPanResponder: () => true,
              onMoveShouldSetPanResponderCapture: () => true,
              onShouldBlockNativeResponder: () => true,
              onPanResponderTerminationRequest: () => false,
 
              onPanResponderGrant: (event) => {
                clearDragSafetyTimer();
                dragReleaseLockRef.current = false;

                requestAnimationFrame(() => {
                  playDragSfxRef.current?.("pick");
                });

                setIsDragging(true);
                // Evita un re-render del componente App durante ogni micro-drag.
                // dragInProgress non viene usato da nessuna logica attiva.
                // setDragInProgress(true);
 
                const touchX = event?.nativeEvent?.pageX ?? 0;
                const touchY = event?.nativeEvent?.pageY ?? 0;
 
                dragTouchStart.current = { x: touchX, y: touchY };
                wasteStartCenter.current = { x: touchX, y: touchY };
 
                pan.stopAnimation();
                pan.setOffset({ x: 0, y: 0 });
                pan.setValue({ x: 0, y: 0 });
 
                if (wasteMeasureRef.current && wasteMeasureRef.current.measureInWindow) {
                  wasteMeasureRef.current.measureInWindow((x, y, width, height) => {
                    wasteStartCenter.current = {
                      x: x + width / 2,
                      y: y + height / 2,
                    };
                  });
                }

                cacheAllBinLayouts();
 
                Animated.spring(dragScale, {
                  toValue: 1.16,
                  friction: 5,
                  tension: 120,
                  useNativeDriver: true,
                }).start();
              },
 
              onPanResponderMove: (event, gestureState) => {
                pan.setValue({
                  x: gestureState.dx,
                  y: gestureState.dy,
                });
              },
 
onPanResponderRelease: (event, gestureState) => {
  if (dragReleaseLockRef.current) return;
  dragReleaseLockRef.current = true;

  requestAnimationFrame(() => {
    playDragSfxRef.current?.("release");
  });
 
  pan.flattenOffset();
  resolveDropTarget(gestureState);
},
 
onPanResponderTerminate: (event, gestureState) => {
  if (dragReleaseLockRef.current) return;
  dragReleaseLockRef.current = true;

  requestAnimationFrame(() => {
    playDragSfxRef.current?.("release");
  });
 
  pan.flattenOffset();
  resolveDropTarget(gestureState);
},
            }),
          []
        );
 
        return (
         <ScreenShell muted disableLeaves performanceMode>
            <View style={styles.gameStatsHeader}>
             <TouchableOpacity
  style={styles.pauseTriggerBtn}
  onPress={withButtonSfx(() => setPaused(true))}
>
                <Text allowFontScaling={false} style={styles.pauseTriggerText}>
                 {text.pause}
                </Text>
              </TouchableOpacity>
 
              <View style={styles.gameStatsRightGroup}>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.lives}: {"❤️".repeat(lives)}
                </Text>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.points}: <Text allowFontScaling={false} style={styles.boldYellow}>{points}</Text>
                </Text>
                <Text allowFontScaling={false} style={styles.gameStatsLabelText}>
                  {text.time}: {time}s
                </Text>
              </View>
            </View>
 
            <ScrollView
              scrollEnabled={!isDragging}
              keyboardShouldPersistTaps="always"
              removeClippedSubviews={false}
              contentContainerStyle={styles.gameplayScrollContainer}
            >
            <TreeComponent
              errors={gameErrors.length}
              activeTree={activeTree}
              language={language}
              performanceMode
              feedback={treeFeedback}
            />
 
              <View style={styles.draggableAreaContainer}>
                <View style={styles.interactiveWasteCard} {...panResponder.panHandlers}>
                  <View ref={wasteMeasureRef} collapsable={false} style={styles.wasteMeasureBox}>
                    <Animated.View
                      renderToHardwareTextureAndroid
                      shouldRasterizeIOS
                      style={[
                        styles.wasteDragHandle,
                        {
                          transform: [
                            { translateX: pan.x },
                            { translateY: pan.y },
                            { scale: dragScale },
                          ],
                        },
                        isDragging && styles.wasteDragHandleActive,
                      ]}
                    >
                      <Text allowFontScaling={false} style={styles.wasteLargeIcon}>
                        {currentWaste?.icon}
                      </Text>
                    </Animated.View>
                  </View>
 
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                    allowFontScaling={false}
                    style={styles.wasteNameTitle}
                  >
                    {getWasteName(currentWaste, language)}
                  </Text>
                </View>
              </View>
 
              <View style={styles.binsInteractiveGrid}>
                {(bins || BINS).map((bin) => (
                  <View
                    key={bin.id}
                    ref={(ref) => {
                      if (ref) binRefs.current[bin.id] = ref;
                    }}
                    onLayout={() => cacheBinLayout(bin.id)}
                    collapsable={false}
                    style={[
                      styles.interactiveBinItem,
                      {
                        backgroundColor: bin.color,
                        borderColor: isDragging ? "#FFFFFF" : bin.color,
                        borderWidth: 3,
                      },
                      isDragging && styles.interactiveBinItemDropReady,
                    ]}
                  >
                    <View style={styles.binFullTouch}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.binLabelOnlyText, { color: "#FFFFFF" }]}
                      >
                       {getBinDisplayLabel(bin, language, text)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
 
              <View style={styles.gameplayInstructionBox}>
                <Text allowFontScaling={false} style={styles.gameplayInstructionText}>
                  {text.gameplayInstruction}
                </Text>
              </View>
            </ScrollView>
 
            {paused && (
              <View style={styles.fullOverlayScreen}>
                <View style={styles.pauseMenuPanel}>
                  <Text allowFontScaling={false} style={styles.pauseMenuTitleText}>
                   {text.pauseTitle}
                  </Text>
 
                  <FancyButton
                    style={styles.pauseMenuButton}
                    label={text.resume}
                    onPress={() => {
                      setPaused(false);
                      setConfirmAbandon(false);
                    }}
                  />
 
                  <FancyButton
                    style={[styles.pauseMenuButton, { backgroundColor: "#D9534F" }]}
                    label={text.abandon}
                    onPress={() => setConfirmAbandon(true)}
                  />
 
                  {confirmAbandon && (
                    <View style={styles.abandonConfirmSubRow}>
                      <FancyButton
                        small
                        style={styles.halfAbandonBtn}
                        label={text.cancel}
                        onPress={() => setConfirmAbandon(false)}
                      />
                      <FancyButton
                        small
                        active
                        style={[styles.halfAbandonBtn, { backgroundColor: "#C9302C" }]}
                        label={text.confirm}
                        onPress={() => {
                          setPaused(false);
                          setScreen("menu");
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScreenShell>
        );
      },
    []
  );
function VisualFeedback({ isVictory, isTreeDead }) {
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const cleanConfigs = useRef(
    Array.from({ length: 12 }, (_, index) => ({
      left: 6 + ((index * 11) % 88),
      top: 18 + ((index * 17) % 62),
      duration: 2600 + (index % 4) * 360,
      delay: (index % 5) * 150,
      driftX: 36 + (index % 4) * 12,
      driftY: -28 - (index % 3) * 10,
      glyph: ["🍃", "✦", "♻️"][index % 3],
    }))
  ).current;

  const smogConfigs = useRef(
    Array.from({ length: 9 }, (_, index) => ({
      left: -12 + ((index * 17) % 112),
      top: 18 + ((index * 13) % 70),
      duration: 3400 + (index % 4) * 420,
      delay: (index % 5) * 210,
      width: 80 + (index % 4) * 24,
      height: 18 + (index % 3) * 8,
      driftX: 20 + (index % 4) * 12,
    }))
  ).current;

  const cleanParticles = useRef(cleanConfigs.map(() => new Animated.Value(0))).current;
  const smogClouds = useRef(smogConfigs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
            isInteraction: false,
        }),
      ])
    );

    const cleanRuns = cleanParticles.map((particle, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(cleanConfigs[index].delay),
          Animated.timing(particle, {
            toValue: 1,
            duration: cleanConfigs[index].duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(particle, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const smogRuns = smogClouds.map((cloud, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloud, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(smogConfigs[index].delay),
          Animated.timing(cloud, {
            toValue: 1,
            duration: smogConfigs[index].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(cloud, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    const animation = Animated.parallel([
      pulse,
      ...(isVictory ? cleanRuns : smogRuns),
    ]);

    animation.start();

    return () => animation.stop();
  }, [isVictory]);

  const heroScale = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isVictory ? 1.06 : 1.025],
  });

  const cleanStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    opacity: animVal.interpolate({
      inputRange: [0, 0.18, 0.78, 1],
      outputRange: [0, 0.72, 0.36, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        translateY: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftY],
        }),
      },
    ],
  });

  const smogStyle = (animVal, config) => ({
    position: "absolute",
    left: String(config.left) + "%",
    top: String(config.top) + "%",
    width: config.width,
    height: config.height,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.22)",
    opacity: animVal.interpolate({
      inputRange: [0, 0.18, 0.75, 1],
      outputRange: [0, 0.48, 0.28, 0],
    }),
    transform: [
      {
        translateX: animVal.interpolate({
          inputRange: [0, 1],
          outputRange: [0, config.driftX],
        }),
      },
      {
        scale: animVal.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.85, 1.1, 1],
        }),
      },
    ],
  });

  return (
    <View
      style={[
        styles.centerShowcaseItemBox,
        styles.ecoResultBox,
        isVictory ? styles.ecoResultBoxVictory : styles.ecoResultBoxDefeat,
      ]}
    >
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 150" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id="ecoResultBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isVictory ? "#064E3B" : "#1E293B"} stopOpacity="1" />
            <Stop offset="0.58" stopColor={isVictory ? "#14532D" : "#334155"} stopOpacity="0.78" />
            <Stop offset="1" stopColor="#020617" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="360" height="150" rx="20" fill="url(#ecoResultBg)" />

        <G opacity={isVictory ? "0.42" : "0.18"}>
          <Rect x="36" y="76" width="18" height="50" rx="4" fill="#22C55E" />
          <Rect x="60" y="58" width="24" height="68" rx="4" fill="#0EA5E9" />
          <Rect x="278" y="64" width="22" height="62" rx="4" fill="#0EA5E9" />
          <Rect x="306" y="86" width="16" height="40" rx="4" fill="#22C55E" />
        </G>

        <Path
          d="M-30 104 C76 76 184 132 390 92"
          stroke={isVictory ? "#86EFAC" : "#94A3B8"}
          strokeWidth="3"
          opacity={isVictory ? "0.25" : "0.16"}
          fill="none"
        />

        <Path
          d="M-40 126 C90 96 210 156 400 116"
          stroke={isVictory ? "#22D3EE" : "#64748B"}
          strokeWidth="2"
          opacity={isVictory ? "0.18" : "0.12"}
          fill="none"
        />
      </Svg>

      <View pointerEvents="none" style={styles.particleContainerLayer}>
        {isVictory
          ? cleanParticles.map((p, i) => (
              <Animated.Text
                key={i}
                allowFontScaling={false}
                pointerEvents="none"
                style={[styles.ecoCleanParticle, cleanStyle(p, cleanConfigs[i])]}
              >
                {cleanConfigs[i].glyph}
              </Animated.Text>
            ))
          : smogClouds.map((s, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={smogStyle(s, smogConfigs[i])}
              />
            ))}
      </View>

      <Animated.View
        style={[
          styles.showcaseItemVisualWrap,
          { zIndex: 10, elevation: 10 },
          { transform: [{ scale: heroScale }] },
        ]}
      >
        <CosmeticVisual
          item={activeTree}
          variant={isVictory ? "victory" : "defeat"}
          size={100}
          emojiStyle={styles.showcaseItemEmoji}
        />
      </Animated.View>
    </View>
  );
}
function EducationalReportPanel({ title, intro, errors = [] }) {
  return (
    <View style={styles.educationalReportBox}>
      <Text allowFontScaling={false} style={styles.educationalHeadline}>
        {title}
      </Text>

      <ScrollView
        style={styles.educationalReportScrollArea}
        contentContainerStyle={styles.educationalReportScrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        overScrollMode="always"
      >
        {intro ? (
          <Text allowFontScaling={false} style={styles.cleanReportText}>
            {intro}
          </Text>
        ) : null}

        {errors.length === 0 ? (
          <Text allowFontScaling={false} style={styles.cleanReportText}>
            {text.perfectReport}
          </Text>
        ) : (
          errors.map((error, idx) => (
            <View key={`${error.name}-${idx}`} style={styles.errorReportItemRow}>
              <Text allowFontScaling={false} style={styles.errorReportTextBullet}>
                • <Text allowFontScaling={false} style={styles.boldBlue}>{error.name}</Text>: {error.desc}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ResultScreen() {
  const isVictory = gameResult === "VITTORIA";
  const isTreeDead = gameErrors.length >= 2 || !isVictory;
 
  return (
    <ScreenShell muted>
      <ScrollView contentContainerStyle={styles.resultContainerContent}>
        <View
          style={[
            styles.resultOutcomeCard,
            isVictory ? styles.outcomeCardWin : styles.outcomeCardLose,
          ]}
        >
          <Text allowFontScaling={false} style={styles.outcomeTitleText}>
            {isVictory ? text.victory : text.defeat}
          </Text>
 
          <FancyButton
            style={styles.outcomeActionBtn}
            label={isVictory ? text.continueGame : text.retry}
            onPress={() => startNewGame(difficulty)}
          />
 
          <FancyButton
            style={styles.outcomeActionBtn}
            label={text.backToMenu}
            onPress={() => setScreen("menu")}
          />
 
          <VisualFeedback isVictory={isVictory} isTreeDead={isTreeDead} />
        </View>
 
        <EducationalReportPanel title={text.educationalReport} errors={gameErrors} />
      </ScrollView>
    </ScreenShell>
  );
}
 
  function LeaderboardScreen() {
  const personalScore = currentUser?.totalScore ?? points ?? 0;
  const personalName = getDisplayUsername();
  const guestCanRank = Boolean(currentUser?.isGuest) && personalScore > 0;

  const registeredLeaderboard = leaderboardRows.slice(0, 10).map((row, index) => ({
    pos: row.position || index + 1,
    name: row.username || row.name,
    userId: row.userId,
    score: row.score ?? row.totalScore ?? 0,
    isGuest: false,
  }));

  const guestRank = guestCanRank
    ? leaderboardGuestPosition ||
      registeredLeaderboard.filter((player) => player.score >= personalScore).length + 1
    : null;

  const registeredRowsForDisplay = guestRank && guestRank <= 10
    ? registeredLeaderboard.map((player) => (
        player.pos >= guestRank ? { ...player, pos: player.pos + 1 } : player
      ))
    : registeredLeaderboard;

  const displayLeaderboard = guestRank && guestRank <= 10
    ? [
        ...registeredRowsForDisplay,
        {
          pos: guestRank,
          name: personalName,
          score: personalScore,
          isGuest: true,
        },
      ]
        .sort((a, b) => a.pos - b.pos || (a.isGuest ? 1 : 0))
        .slice(0, 10)
    : registeredRowsForDisplay;

  const personalRankEntry = currentUser?.isGuest
    ? displayLeaderboard.find((player) => player.isGuest)
    : displayLeaderboard.find((player) => player.userId === currentUser?.id || player.name === personalName);

  const personalRankLabel = currentUser?.isGuest
    ? guestRank
      ? `#${guestRank} ${text.inLeaderboard}`
      : text.notRanked
    : personalRankEntry?.pos
    ? `#${personalRankEntry.pos} ${text.inLeaderboard}`
    : authToken
    ? text.online
    : text.notRanked;

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.tdLeaderboardTopBarFixed}>
        <GoBackButton onPress={() => setScreen("menu")} />
        <Text allowFontScaling={false} style={styles.globalBadgeHeader}>
          {text.global}
        </Text>
      </View>

      <ScrollView
        style={styles.tdLeaderboardRealScroll}
        contentContainerStyle={styles.tdLeaderboardRealContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        overScrollMode="always"
        scrollEventThrottle={16}
      >
        <View style={styles.tdLeaderboardPanelFixed}>
          <Text allowFontScaling={false} style={styles.panelTitleText}>
            {text.leaderboard}
          </Text>

          {leaderboardLoading ? (
            <Text allowFontScaling={false} style={styles.leaderboardNameText}>{text.loading}</Text>
          ) : null}

          <View style={styles.tdLeaderboardRowsBoxFixed}>
            {displayLeaderboard.length === 0 && !leaderboardLoading ? (
              <Text allowFontScaling={false} style={styles.leaderboardNameText}>{text.notRanked}</Text>
            ) : null}

            {displayLeaderboard.slice(0, 10).map((player) => (
              <View key={`${player.pos}-${player.name}`} style={styles.leaderboardItemRow}>
                <Text allowFontScaling={false} style={styles.leaderboardRankText}>
                  {player.pos}.
                </Text>
                <Text allowFontScaling={false} style={styles.leaderboardNameText}>
                  {player.name}
                </Text>
                <Text allowFontScaling={false} style={styles.leaderboardPointsText}>
                  {player.score} pts
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.userPersonalRankCard}>
            <Text allowFontScaling={false} style={styles.personalTitleLabel}>
              {text.you}
            </Text>
            <Text allowFontScaling={false} style={styles.personalRankPosText}>
              {personalRankLabel}
            </Text>
            <Text allowFontScaling={false} style={styles.personalUsernameText}>
              {personalName}
            </Text>
            <Text allowFontScaling={false} style={styles.personalScoreText}>
              {personalScore} pts
            </Text>
          </View>
        </View>

        <View style={styles.tdLeaderboardAndroidBottomSpaceFixed} />
      </ScrollView>
    </ScreenShell>
  );
}
 
function ShopScreen() {
  const handleBuyItem = async (item) => {
    if (coins < item.cost) return;

    if (authToken && !currentUser?.isGuest) {
      try {
        const result = await apiRequest("/shop/buy", {
          method: "POST",
          token: authToken,
          body: { itemId: item.id },
        });
        applyBackendProfile(result, authToken);
        return;
      } catch (error) {
        console.log("Acquisto backend non riuscito, proseguo in locale:", error.message);
      }
    }

    setCoins((currentCoins) => currentCoins - item.cost);
    setShopItems((prev) =>
      prev.map((shopItem) =>
        shopItem.id === item.id ? { ...shopItem, bought: true } : shopItem
      )
    );
  };

  const handleEquipItem = async (item) => {
    setEquippedTreeId(item.id);

    if (authToken && !currentUser?.isGuest) {
      try {
        const result = await apiRequest("/shop/equip", {
          method: "POST",
          token: authToken,
          body: { itemId: item.id },
        });
        applyBackendProfile(result, authToken);
      } catch (error) {
        console.log("Equip backend non riuscito:", error.message);
      }
    }
  };
 
  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
 
        <Text allowFontScaling={false} style={styles.coinsCounterText}>
          {text.balance}: {coins} 🪙
        </Text>
      </View>
 
      <ScrollView contentContainerStyle={styles.shopScrollLayout}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.shop}
        </Text>
 
        {[...shopItems].sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)).map((item) => {
          const isEquipped = equippedTreeId === item.id;
          const canBuy = coins >= item.cost;
 
          return (
            <View
              key={item.id}
              style={[styles.shopItemCardRow, { borderColor: item.borderColor }]}
            >
              <View style={styles.shopItemIconPreviewBox}>
                <View
                  style={[
                    styles.absoluteCardBg,
                    { backgroundColor: item.borderColor, opacity: 0.18 },
                  ]}
                />
 
                <CosmeticVisual
                  item={item}
                  variant="base"
                  size={64}
                  emojiStyle={styles.shopItemLargeEmoji}
                />
              </View>
 
              <View style={styles.shopItemMetaDetailsInfo}>
                <Text allowFontScaling={false} style={styles.shopItemNameText}>
                  {getShopItemName(item, language)}
                </Text>
 
                <Text allowFontScaling={false} style={styles.shopItemSubMetaText}>
                  {text.type}:{" "}
                  <Text allowFontScaling={false} style={{ color: "#F8FAFC" }}>
                    {text.cosmetic}
                  </Text>
                </Text>
 
                <Text allowFontScaling={false} style={styles.shopItemSubMetaText}>
                  {text.cost}:{" "}
                  <Text
                    allowFontScaling={false}
                    style={{ color: "#F59E0B", fontWeight: "700" }}
                  >
                    {item.cost} 🪙
                  </Text>
                </Text>
 
                <View style={styles.shopDualButtonsRowContainer}>
                  <View style={styles.shopLeftButtonSlot}>
                    {item.bought && (
                      <FancyButton
                        small
                        active={isEquipped}
                        label={isEquipped ? text.equipped : text.equip}
                        onPress={() => handleEquipItem(item)}
                        style={styles.shopItemMainActionButton}
                        textStyle={styles.shopActionButtonText}
                      />
                    )}
                  </View>
 
                  <View style={styles.shopRightButtonSlot}>
                    {!item.bought ? (
                      <FancyButton
                        small
                        disabled={!canBuy}
                        label={text.buy}
                        onPress={() => handleBuyItem(item)}
                        style={[
                          styles.shopItemMainActionButton,
                          {
                            backgroundColor: "#F59E0B",
                            borderColor: "#D97706",
                          },
                        ]}
                        textStyle={styles.shopActionButtonText}
                      />
                    ) : (
                      <View style={styles.alreadyBoughtBadge}>
                        <Text allowFontScaling={false} style={styles.alreadyBoughtText}>
                          {text.unlocked}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
}
 
  
 
  function BattleScreen() {
  const battleDifficulty = normalizeBattleDifficulty(difficulty);

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <View style={[styles.centralPanel, styles.tdBattlePanel]}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.battle}
        </Text>

        <View style={styles.battleDifficultySelectorBox}>
          <Text allowFontScaling={false} style={styles.inputFriendCodeLabel}>
            {text.battleDifficulty}
          </Text>

          <View style={styles.battleDifficultyButtonsRow}>
            {BATTLE_DIFFICULTIES.map((level) => (
              <FancyButton
                key={level}
                small
                active={battleDifficulty === level}
                label={level === "Facile" ? text.easy : level === "Difficile" ? text.hard : text.medium}
                onPress={() => setDifficulty(level)}
                style={styles.battleDifficultyButton}
              />
            ))}
          </View>
        </View>
 
        <View style={styles.multiplayerActionCardBox}>
          <Text allowFontScaling={false} style={styles.multiplayerSectionTitleText}>
            {text.createChallenge}
          </Text>
 
          <FancyButton small label={text.generateLobbyCode} onPress={handleGenerateLobby} />
 
          <Text selectable allowFontScaling={false} style={styles.lobbyCodeGeneratedDisplay}>
            {text.roomCode}:{" "}
            <Text allowFontScaling={false} style={styles.boldBlue}>
              {lobbyCode || "----"}
            </Text>
          </Text>
 
          <Text allowFontScaling={false} style={styles.lobbyStatusMessageText}>
            {text.status}: {lobbyStatus || text.noLobby}
          </Text>
        </View>
 
        <View style={styles.multiplayerActionCardBox}>
          <Text allowFontScaling={false} style={styles.multiplayerSectionTitleText}>
            {text.joinChallenge}
          </Text>
 
          <Text allowFontScaling={false} style={styles.inputFriendCodeLabel}>
            {text.enterFriendCode}
          </Text>
 
          <TextInput
            style={styles.lobbyCodeInputField}
            placeholder={text.lobbyPlaceholder}
            placeholderTextColor="#999"
            value={inputLobbyCode}
            onChangeText={setInputLobbyCode}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleJoinLobby}
          />
 
          <FancyButton small label={text.enterLobby} onPress={handleJoinLobby} />
        </View>
      </View>
    </ScreenShell>
  );
}
 
  function BattleEndScreen() {
  const resultLobby = battleResult || battleLobby || {};
  const youAreHost = battleRole === "host";
  const myScore = youAreHost ? resultLobby.hostScore : resultLobby.guestScore;
  const opponentScore = youAreHost ? resultLobby.guestScore : resultLobby.hostScore;
  const myName = getDisplayUsername();
  const hostName = resultLobby.host?.username || (youAreHost ? myName : text.opponentName);
  const guestName = resultLobby.guest?.username || (!youAreHost ? myName : text.opponentName);
  const opponentName = youAreHost
    ? guestName
    : hostName;
  const isBattleFinished = resultLobby.status === "FINISHED";
  const isBattleDraw =
    isBattleFinished &&
    resultLobby.hostScore !== null &&
    resultLobby.hostScore !== undefined &&
    resultLobby.guestScore !== null &&
    resultLobby.guestScore !== undefined &&
    resultLobby.hostScore === resultLobby.guestScore;
  const winnerName =
    isBattleDraw
      ? "Pareggio"
      : isBattleFinished
      ? resultLobby.winnerId === resultLobby.hostId
        ? hostName
        : resultLobby.winnerId === resultLobby.guestId
        ? guestName
        : "Pareggio"
      : "In attesa...";

  return (
    <ScreenShell muted>
      <View pointerEvents="box-none" style={styles.headerBar}>
        <GoBackButton onPress={() => setScreen("menu")} />
      </View>
 
      <ScrollView
        contentContainerStyle={styles.battleEndScrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        overScrollMode="always"
      >
      <View style={styles.centralPanel}>
        <Text allowFontScaling={false} style={styles.panelTitleText}>
          {text.battleEnd}
        </Text>
 
        <View style={styles.battleWinnerAnnouncementCard}>
          <Text allowFontScaling={false} style={styles.crownCelebrationIcon}>
            {isBattleDraw ? "🤝" : "👑"}
          </Text>
 
          <Text allowFontScaling={false} style={styles.winnerNameAnnouncementText}>
            {isBattleDraw ? winnerName : `${text.winner}: ${winnerName}`}
          </Text>

          {(battleWaitingResult || !isBattleFinished) && (
            <Text allowFontScaling={false} style={styles.lobbyStatusMessageText}>
              In attesa del punteggio dell'avversario...
            </Text>
          )}
 
          <View style={styles.battleVersusScoreboardRow}>
            <View style={styles.versusPlayerStatsColumn}>
              <Text allowFontScaling={false} style={styles.versusPlayerNameText}>
                {text.you}{"\n"}({myName})
              </Text>
              <Text allowFontScaling={false} style={styles.versusPlayerPointsValue}>
                {myScore ?? points} pts
              </Text>
            </View>
 
            <Text allowFontScaling={false} style={styles.vsCentralLabel}>
              VS
            </Text>
 
            <View style={styles.versusPlayerStatsColumn}>
              <Text allowFontScaling={false} style={styles.versusPlayerNameText}>
                {text.opponentName}{"\n"}({opponentName})
              </Text>
              <Text allowFontScaling={false} style={styles.versusPlayerPointsValue}>
                {opponentScore ?? "--"} pts
              </Text>
            </View>
          </View>
        </View>
 
        <EducationalReportPanel title={text.battleReport} intro={text.battleReportText} errors={gameErrors} />
      </View>
      </ScrollView>
    </ScreenShell>
  );
}
 
  function SettingsScreen() {
    return (
     <ScreenShell muted>
        <View pointerEvents="box-none" style={styles.headerBar}>
          <GoBackButton onPress={() => setScreen("menu")} />
        </View>
 
        <View style={[styles.centralPanel, styles.tdSettingsPanel]}>
          <Text allowFontScaling={false} style={styles.panelTitleText}>
            {text.titleSettings}
          </Text>
 
         <ToggleRow label={text.labelMusic} value={music} onChange={handleMusicChange} />
<ToggleRow label={text.labelSfx} value={sfx} onChange={setSfx} />
<ToggleRow label={text.labelLoc} value={localization} onChange={handleLocalizationChange} />

          <View style={styles.locationStatusInfoBox}>
            <Text allowFontScaling={false} style={styles.locationStatusInfoText}>
              {text.locationStatusLabel}: {getLocalizedLocationStatus()}
            </Text>
          </View>
 
          <View style={styles.settingToggleItemRow}>
            <Text allowFontScaling={false} style={styles.settingItemLabelText}>
            {text.labelLang}:
            </Text>
 
            <TouchableOpacity
              style={[styles.languageDropdownAnchorTrigger, styles.tdSettingsSelectButton]}
             onPress={withButtonSfx(() => setShowLangMenu((value) => !value))}
            >
              <Text allowFontScaling={false} style={styles.languageDropdownAnchorText}>
                {language} ▼
              </Text>
            </TouchableOpacity>
          </View>
 
          {showLangMenu && (
            <View style={styles.languageFloatingMenuOptionsContainer}>
              <TouchableOpacity
                style={styles.languageMenuOptionItem}
                onPress={withButtonSfx(() => {
  setLanguage("Italiano");
  setShowLangMenu(false);
})}
              >
                <Text allowFontScaling={false} style={styles.languageMenuOptionItemText}>
                  Italiano
                </Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                style={styles.languageMenuOptionItem}
                onPress={withButtonSfx(() => {
  setLanguage("English");
  setShowLangMenu(false);
})}
              >
                <Text allowFontScaling={false} style={styles.languageMenuOptionItemText}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          )}
 
          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.disconnectButton, styles.tdSettingsLogoutButton]}
            onPress={withButtonSfx(handleLogout)}
          >
            <Text allowFontScaling={false} style={styles.disconnectButtonText}>
              {text.logout}
            </Text>
          </TouchableOpacity>
        </View>
     </ScreenShell>
    );
  }
 
  if (screen === "auth") return AuthScreen({ isRegister: false });
  if (screen === "login") return AuthScreen({ isRegister: false });
  if (screen === "register") return AuthScreen({ isRegister: true });
  if (screen === "menu") return MainMenuScreen();
  if (screen === "difficulty") return DifficultyScreen();
  if (screen === "gameplay")
    return (
      <GameplayScreen
        lives={lives}
        points={points}
        time={time}
        gameErrors={gameErrors}
        activeTree={activeTree}
        currentWaste={currentWaste}
        treeFeedback={treeFeedback}
        paused={paused}
        confirmAbandon={confirmAbandon}
        setPaused={setPaused}
        setConfirmAbandon={setConfirmAbandon}
        setDragInProgress={setDragInProgress}
        setScreen={setScreen}
        handleWasteSorting={handleWasteSorting}
        bins={activeBins}
        text={text}
        language={language}
        playDragSfx={gameplaySfxDirector}
      />
    );
  if (screen === "result") return ResultScreen();
  if (screen === "leaderboard") return LeaderboardScreen();
  if (screen === "shop") return ShopScreen();
  if (screen === "battle") return BattleScreen();
  if (screen === "battleEnd") return BattleEndScreen();
  if (screen === "settings") return SettingsScreen();

  return MainMenuScreen();
}
 
// ============================================================================
// FOGLI DI STILE (STYLESHEET)
// ============================================================================
