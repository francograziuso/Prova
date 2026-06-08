import type { Difficulty } from "../../../domain/entities/types";
import type { CatalogRepository, RuleSetWithWastes } from "../../../domain/repositories/CatalogRepository";

const REGION_CAPITALS: Record<string, string> = {
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
  Veneto: "Venezia"
};

const REGION_ALIASES: Record<string, string> = {
  abruzzo: "Abruzzo",
  basilicata: "Basilicata",
  calabria: "Calabria",
  campania: "Campania",
  "emilia romagna": "Emilia-Romagna",
  "emilia-romagna": "Emilia-Romagna",
  "friuli venezia giulia": "Friuli-Venezia Giulia",
  "friuli-venezia giulia": "Friuli-Venezia Giulia",
  lazio: "Lazio",
  latium: "Lazio",
  liguria: "Liguria",
  lombardia: "Lombardia",
  lombardy: "Lombardia",
  marche: "Marche",
  molise: "Molise",
  piemonte: "Piemonte",
  piedmont: "Piemonte",
  puglia: "Puglia",
  apulia: "Puglia",
  sardegna: "Sardegna",
  sardinia: "Sardegna",
  sicilia: "Sicilia",
  sicily: "Sicilia",
  toscana: "Toscana",
  tuscany: "Toscana",
  "trentino alto adige": "Trentino-Alto Adige",
  "trentino-alto adige": "Trentino-Alto Adige",
  "trentino alto adige sudtirol": "Trentino-Alto Adige",
  "trentino alto adige südtirol": "Trentino-Alto Adige",
  "trentino south tyrol": "Trentino-Alto Adige",
  "trentino-south tyrol": "Trentino-Alto Adige",
  umbria: "Umbria",
  "valle d aosta": "Valle d'Aosta",
  "valle d'aosta": "Valle d'Aosta",
  "aosta valley": "Valle d'Aosta",
  veneto: "Veneto",
  venetia: "Veneto"
};

function simplify(value?: string) {
  return String(value || "")
    .replace(/^regione\s+/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-zA-Z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeRegion(value?: string) {
  const key = simplify(value);
  if (!key) return undefined;
  if (REGION_ALIASES[key]) return REGION_ALIASES[key];

  return Object.keys(REGION_CAPITALS).find((region) => simplify(region) === key) ||
    String(value || "").replace(/^Regione\s+/i, "").trim();
}

function normalizeCapital(region?: string, capitalCity?: string) {
  if (region && REGION_CAPITALS[region]) return REGION_CAPITALS[region];
  const value = String(capitalCity || "").trim();
  return value || undefined;
}

function ruleSetSummary(ruleSet: RuleSetWithWastes | null) {
  return ruleSet ? {
    id: ruleSet.id,
    region: ruleSet.region,
    capitalCity: ruleSet.capitalCity,
    isDefault: ruleSet.isDefault
  } : null;
}

export function createCatalogUseCases(catalog: CatalogRepository) {
  async function resolveRuleSet(region?: string, capitalCity?: string) {
    const normalizedRegion = normalizeRegion(region);
    const normalizedCapital = normalizeCapital(normalizedRegion, capitalCity);

    if (normalizedRegion && normalizedCapital) {
      const specific = await catalog.findSpecificRuleSet(normalizedRegion, normalizedCapital);
      if (specific) return specific;
    }

    if (normalizedRegion) {
      const byRegion = await catalog.findByRegion(normalizedRegion);
      if (byRegion) return byRegion;
    }

    if (normalizedCapital) {
      const byCapital = await catalog.findByCapital(normalizedCapital);
      if (byCapital) return byCapital;
    }

    return catalog.findDefaultRuleSet();
  }

  return {
    async areas() {
      const areas = await catalog.findAreas();
      return { items: areas };
    },

    async rules(input: { region?: string; capitalCity?: string }) {
      const ruleSet = await resolveRuleSet(input.region, input.capitalCity);
      return { ruleSet };
    },

    async bins(input: { region?: string; capitalCity?: string }) {
      const ruleSet = await resolveRuleSet(input.region, input.capitalCity);
      return {
        ruleSet: ruleSetSummary(ruleSet),
        items: ruleSet?.wasteTypes.map((type) => ({
          id: type.code,
          label: type.label,
          color: type.color,
          textColor: type.textColor,
          localColor: type.localColor,
          note: type.note,
          sourceUrl: type.sourceUrl
        })) ?? []
      };
    },

    async wastes(input: { region?: string; capitalCity?: string; difficulty?: Difficulty }) {
      const ruleSet = await resolveRuleSet(input.region, input.capitalCity);
      const items = (ruleSet?.wasteTypes ?? []).flatMap((type) =>
        type.wastes
          .filter((waste) => !input.difficulty || waste.difficulty === input.difficulty)
          .map((waste) => ({
            id: waste.id,
            name: waste.name,
            icon: waste.icon,
            type: type.code,
            desc: waste.description,
            difficulty: waste.difficulty,
            localColor: type.localColor
          }))
      );

      return {
        ruleSet: ruleSetSummary(ruleSet),
        items
      };
    }
  };
}
