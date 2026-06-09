// Domain layer: regole locali e adattamento catalogo per regione/capoluogo.
import { BINS } from "../game/wasteCatalog";
import { WASTE_POOLS } from "../game/gameRules";

export const ITALIAN_REGION_CAPITALS = {
  Abruzzo: "L'Aquila",
  Basilicata: "Potenza",
  Calabria: "Catanzaro",
  Campania: "Napoli",
  "Emilia-Romagna": "Bologna",
  "Friuli-Venezia Giulia": "Trieste",
  Lazio: "Roma",
  Liguria: "Genova",
  Lombardia: "Milano",
  Marche: "Ancona",
  Molise: "Campobasso",
  Piemonte: "Torino",
  Puglia: "Bari",
  Sardegna: "Cagliari",
  Sicilia: "Palermo",
  Toscana: "Firenze",
  "Trentino-Alto Adige": "Trento",
  Umbria: "Perugia",
  "Valle d'Aosta": "Aosta",
  Veneto: "Venezia",
};

const LOCAL_RULE_FALLBACKS = [
  { region: "Abruzzo", capitalCity: "L'Aquila", colors: { carta: "Bianco", multi: "Giallo", vetro: "Blu", umido: "Marrone", secco: "Verde" } },
  { region: "Basilicata", capitalCity: "Potenza", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Calabria", capitalCity: "Catanzaro", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Campania", capitalCity: "Napoli", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Emilia-Romagna", capitalCity: "Bologna", colors: { carta: "Blu / Azzurro", multi: "Giallo (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" } },
  { region: "Friuli-Venezia Giulia", capitalCity: "Trieste", colors: { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + lattine/metalli", umido: "Marrone", secco: "Grigio" } },
  { region: "Lazio", capitalCity: "Roma", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" } },
  { region: "Liguria", capitalCity: "Genova", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Lombardia", capitalCity: "Milano", colors: { carta: "Blu", multi: "Sacco giallo trasparente", vetro: "Verde", umido: "Marrone", secco: "Sacco grigio/neutro trasparente" } },
  { region: "Marche", capitalCity: "Ancona", colors: { carta: "Blu (nuovi UNI; in alcune guide PaP vecchio contenitore bianco)", multi: "Giallo / metalli turchese", vetro: "Verde (vetro; in alcune zone vetro+metalli)", umido: "Marrone", secco: "Grigio" } },
  { region: "Molise", capitalCity: "Campobasso", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Piemonte", capitalCity: "Torino", colors: { carta: "Giallo", multi: "Grigio - metalli", vetro: "Blu (vetro + imballaggi in metallo)", umido: "Marrone", secco: "Verde" } },
  { region: "Puglia", capitalCity: "Bari", colors: { carta: "Blu / Azzurro", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Sardegna", capitalCity: "Cagliari", colors: { carta: "Giallo", multi: "Blu (plastica)", vetro: "Verde + latta/lattine", umido: "Marrone", secco: "Grigio" } },
  { region: "Sicilia", capitalCity: "Palermo", colors: { carta: "Bianco", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Toscana", capitalCity: "Firenze", colors: { carta: "Giallo (in transizione a Blu)", multi: "Azzurro (in transizione a Giallo)", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Trentino-Alto Adige", capitalCity: "Trento", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio chiaro" } },
  { region: "Umbria", capitalCity: "Perugia", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Valle d'Aosta", capitalCity: "Aosta", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
  { region: "Veneto", capitalCity: "Venezia", colors: { carta: "Blu", multi: "Giallo", vetro: "Verde", umido: "Marrone", secco: "Grigio" } },
];

const ITALIAN_REGION_ALIASES = {
  "Aosta Valley": "Valle d'Aosta",
  "Apulia": "Puglia",
  "Emilia Romagna": "Emilia-Romagna",
  "Friuli Venezia Giulia": "Friuli-Venezia Giulia",
  "Latium": "Lazio",
  "Lombardy": "Lombardia",
  "Piedmont": "Piemonte",
  "Sardinia": "Sardegna",
  "Sicily": "Sicilia",
  "Tuscany": "Toscana",
  "Trentino South Tyrol": "Trentino-Alto Adige",
  "Trentino-Alto Adige/South Tyrol": "Trentino-Alto Adige",
  "Trentino-South Tyrol": "Trentino-Alto Adige",
  "Valle d Aosta": "Valle d'Aosta",
  "Venetia": "Veneto",
};

const compactAreaName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/^regione\s+/i, "")
    .replace(/^region\s+of\s+/i, "")
    .replace(/\b(regione|region|italia|italy)\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const REGION_BY_COMPACT_NAME = Object.fromEntries(
  Object.keys(ITALIAN_REGION_CAPITALS).flatMap((region) => {
    const compact = compactAreaName(region);
    const withoutHyphen = compactAreaName(region.replace(/-/g, " "));
    return [
      [compact, region],
      [withoutHyphen, region],
    ];
  })
);

const REGION_ALIAS_BY_COMPACT_NAME = Object.fromEntries(
  Object.entries(ITALIAN_REGION_ALIASES).map(([alias, region]) => [compactAreaName(alias), region])
);

const CAPITAL_TO_REGION = Object.fromEntries(
  Object.entries(ITALIAN_REGION_CAPITALS).map(([region, capitalCity]) => [compactAreaName(capitalCity), region])
);

const PLACE_TO_REGION_ALIASES = {
  naples: "Campania",
  rome: "Lazio",
  milan: "Lombardia",
  turin: "Piemonte",
  florence: "Toscana",
  venice: "Veneto",
  bologne: "Emilia-Romagna",
  bolzano: "Trentino-Alto Adige",
  bozen: "Trentino-Alto Adige",
  aquila: "Abruzzo",
  "l aquila": "Abruzzo",
  "laquila": "Abruzzo",
  "citta metropolitana di napoli": "Campania",
  "metropolitan city of naples": "Campania",
  "citta metropolitana di roma capitale": "Lazio",
  "metropolitan city of rome capital": "Lazio",
  "citta metropolitana di milano": "Lombardia",
  "metropolitan city of milan": "Lombardia",
  "citta metropolitana di torino": "Piemonte",
  "metropolitan city of turin": "Piemonte",
  "citta metropolitana di venezia": "Veneto",
  "metropolitan city of venice": "Veneto",
  "citta metropolitana di firenze": "Toscana",
  "metropolitan city of florence": "Toscana",
  "citta metropolitana di bologna": "Emilia-Romagna",
  "metropolitan city of bologna": "Emilia-Romagna",
  "citta metropolitana di genova": "Liguria",
  "metropolitan city of genoa": "Liguria",
  "citta metropolitana di bari": "Puglia",
  "metropolitan city of bari": "Puglia",
  "citta metropolitana di palermo": "Sicilia",
  "metropolitan city of palermo": "Sicilia",
  "citta metropolitana di cagliari": "Sardegna",
  "metropolitan city of cagliari": "Sardegna",
  "citta metropolitana di messina": "Sicilia",
  "citta metropolitana di catania": "Sicilia",
  "citta metropolitana di reggio calabria": "Calabria",
};

const COUNTRY_ITALY_VALUES = new Set(["it", "ita", "italia", "italy", "italie"]);

export const LOCATION_REQUEST_TIMEOUT_MS = 14000;
export const LOCATION_LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

export function normalizeItalianRegion(value) {
  const raw = String(value || "");
  const clean = raw
    .replace(/^Regione\s+/i, "")
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "";
  const compact = compactAreaName(clean);
  return (
    ITALIAN_REGION_ALIASES[clean] ||
    REGION_ALIAS_BY_COMPACT_NAME[compact] ||
    REGION_BY_COMPACT_NAME[compact] ||
    PLACE_TO_REGION_ALIASES[compact] ||
    CAPITAL_TO_REGION[compact] ||
    ""
  );
}

export function isKnownItalianRegion(value) {
  return Boolean(normalizeItalianRegion(value));
}

function resolveRegionFromPlace(value) {
  const compact = compactAreaName(value);
  if (!compact) return "";

  const direct = PLACE_TO_REGION_ALIASES[compact] || CAPITAL_TO_REGION[compact];
  if (direct) return direct;

  const withoutAdministrativePrefix = compact
    .replace(/^(citta metropolitana di|metropolitan city of|provincia di|province of|provincia|province)\s+/, "")
    .trim();

  return (
    PLACE_TO_REGION_ALIASES[withoutAdministrativePrefix] ||
    CAPITAL_TO_REGION[withoutAdministrativePrefix] ||
    ""
  );
}

export function resolveItalianRegionFromParts(...parts) {
  for (const part of parts) {
    const region = normalizeItalianRegion(part);
    if (region) return region;
  }

  for (const part of parts) {
    const region = resolveRegionFromPlace(part);
    if (region) return region;
  }

  return "";
}

export function resolveItalianCapitalCity(region, preferredCity) {
  const normalizedRegion = normalizeItalianRegion(region);
  return preferredCity || ITALIAN_REGION_CAPITALS[normalizedRegion] || "Standard";
}

function normalizeCountryForArea(value) {
  const compact = compactAreaName(value);
  if (!compact) return "";
  if (COUNTRY_ITALY_VALUES.has(compact)) return "IT";
  return String(value || "").trim().toUpperCase();
}

export function resolveItalianAreaFromGeocodePayload(payload = {}) {
  const countryCode = normalizeCountryForArea(
    payload.countryCode ||
      payload.isoCountryCode ||
      payload.country ||
      payload.countryName
  );

  if (countryCode && countryCode !== "IT") {
    return { outsideItaly: true, countryCode };
  }

  const city =
    payload.city ||
    payload.locality ||
    payload.district ||
    payload.municipality ||
    payload.name ||
    "";
  const region = resolveItalianRegionFromParts(
    payload.principalSubdivision,
    payload.region,
    payload.subregion,
    payload.adminArea,
    payload.county,
    payload.localityInfo?.administrative?.[1]?.name,
    payload.localityInfo?.administrative?.[2]?.name,
    payload.localityInfo?.administrative?.[3]?.name,
    city
  );

  if (!region) return null;

  return {
    countryCode: "IT",
    region,
    principalSubdivision: region,
    capitalCity: ITALIAN_REGION_CAPITALS[region] || city || "Standard",
    city: city || ITALIAN_REGION_CAPITALS[region] || null,
    locality: payload.locality || city || null,
  };
}

function normalizeRuleKey(region, capitalCity) {
  return `${normalizeItalianRegion(region).toLowerCase()}|${String(capitalCity || "").trim().toLowerCase()}`;
}

function colorHexFromLocalRule(localColor, fallback) {
  const normalized = String(localColor || "").toLowerCase();
  if (normalized.includes("non separato")) return "#6B7280";
  if (normalized.includes("bianco")) return "#F8FAFC";
  if (normalized.includes("azzurro")) return "#38BDF8";
  if (normalized.includes("blu")) return "#006CB7";
  if (normalized.includes("giallo")) return "#F7D117";
  if (normalized.includes("marrone")) return "#8B5A2B";
  if (normalized.includes("verde")) return "#00843D";
  if (normalized.includes("grigio") || normalized.includes("residuo") || normalized.includes("neutro")) return "#6B7280";
  if (normalized.includes("rosso")) return "#E30613";
  return fallback;
}

function textColorFromBinColor(hex) {
  const normalized = String(hex || "").toUpperCase();
  if (normalized === "#F8FAFC" || normalized === "#FFFFFF") return "#111827";
  return "#FFFFFF";
}

export function getLocalRuleFallback(area) {
  if (!area?.region || !area?.capitalCity) return null;

  const targetKey = normalizeRuleKey(area.region, area.capitalCity);
  const rule = LOCAL_RULE_FALLBACKS.find((item) => normalizeRuleKey(item.region, item.capitalCity) === targetKey);

  if (!rule) return null;

  const items = BINS.map((bin) => {
    const localColor = rule.colors[bin.id];
    const color = colorHexFromLocalRule(localColor, bin.color);

    return {
      ...bin,
      label: bin.labelFull || bin.label,
      color,
      textColor: textColorFromBinColor(color),
      localColor,
      note: "Regole locali applicate dal fallback integrato.",
    };
  });

  return {
    ruleSet: {
      id: `local-${rule.region}-${rule.capitalCity}`,
      region: rule.region,
      capitalCity: rule.capitalCity,
      isDefault: false,
      isLocalFallback: true,
    },
    items: decorateBinsForLocalRules(items),
  };
}

export function getRuleBehaviorFromBins(items = []) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const textFor = (id) => {
    const item = byId.get(id) || {};
    return `${item.label || ""} ${item.localColor || ""}`.toLowerCase();
  };

  const vetroText = textFor("vetro");
  const multiText = textFor("multi");
  const umidoText = textFor("umido");
  const explicitMetalWithGlass =
    /(\+|insieme a|con|col)\s*(?:imballaggi\s+in\s+)?(?:metall|allumin|latta|lattin)/i.test(vetroText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(vetroText) ||
    /-\s*(?:metall|allumin|latta|lattin)/i.test(multiText) ||
    /(?:metall|allumin|latta|lattin).{0,28}(?:vetro|blu)/i.test(multiText);
  const onlySomeAreas = /alcune zone/i.test(vetroText);

  return {
    glassTakesMetal: explicitMetalWithGlass && !onlySomeAreas,
    glassTakesPlastic:
      /plastica/i.test(vetroText) &&
      /(insieme|con|col|\+)/i.test(vetroText),
    organicToResidual: /non\s+separato|non\s+previsto|residuo/i.test(umidoText),
  };
}

function isMetalWaste(waste = {}) {
  const name = String(waste.name || "").toLowerCase();
  return /lattina|lattine|alluminio|latta|vaschetta\s+alluminio/.test(name);
}

export function decorateBinsForLocalRules(items = []) {
  const behavior = getRuleBehaviorFromBins(items);

  return items.map((bin) => {
    if (bin.id === "vetro" && behavior.glassTakesPlastic) {
      return { ...bin, label: "Vetro plastica lattine" };
    }

    if (bin.id === "vetro" && behavior.glassTakesMetal) {
      return { ...bin, label: "Vetro e metalli" };
    }

    if (bin.id === "multi" && behavior.glassTakesPlastic) {
      return { ...bin, label: "Multi locale" };
    }

    if (bin.id === "multi" && behavior.glassTakesMetal) {
      return { ...bin, label: "Plastica" };
    }

    if (bin.id === "umido" && behavior.organicToResidual) {
      return { ...bin, label: "Organico nel residuo" };
    }

    return bin;
  });
}

export function applyLocalSortingToWaste(waste, bins = BINS) {
  const behavior = getRuleBehaviorFromBins(bins);

  if (waste?.type === "umido" && behavior.organicToResidual) {
    return {
      ...waste,
      type: "secco",
      desc: `${waste.desc} Regola locale attiva: l'organico viene gestito nel residuo.`,
    };
  }

  if (waste?.type === "multi" && behavior.glassTakesPlastic) {
    return {
      ...waste,
      type: "vetro",
      desc: `${waste.desc} Regola locale attiva: plastica, vetro e lattine sono raccolti insieme.`,
    };
  }

  if (waste?.type === "multi" && behavior.glassTakesMetal && isMetalWaste(waste)) {
    return {
      ...waste,
      type: "vetro",
      desc: `${waste.desc} Regola locale attiva: metalli e lattine vanno nel bidone del vetro.`,
    };
  }

  return waste;
}

export function buildWastePoolsForBins(bins = BINS, sourcePools = WASTE_POOLS) {
  return Object.fromEntries(
    Object.entries(sourcePools).map(([level, pool]) => [
      level,
      pool.map((waste) => applyLocalSortingToWaste(waste, bins)),
    ])
  );
}

export function groupCatalogWastesByDifficulty(items = [], bins = BINS) {
  const grouped = { Facile: [], Medio: [], Difficile: [] };
  const fallbackPools = buildWastePoolsForBins(bins);

  items.forEach((item) => {
    const difficultyLevel = grouped[item.difficulty] ? item.difficulty : "Facile";
    grouped[difficultyLevel].push(
      applyLocalSortingToWaste(
        {
          name: item.name,
          icon: item.icon,
          type: item.type,
          desc: item.desc,
        },
        bins
      )
    );
  });

  return Object.fromEntries(
    Object.entries(grouped).map(([level, pool]) => {
      const merged = [...pool];
      const seen = new Set(merged.map((item) => item.name));

      (fallbackPools[level] || []).forEach((item) => {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          merged.push(item);
        }
      });

      return [level, merged.length > 0 ? merged : fallbackPools[level]];
    })
  );
}
