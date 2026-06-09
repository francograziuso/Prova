import type { GeolocationProvider } from "../../application/ports/GeolocationProvider";

const ITALIAN_REGION_CAPITALS: Record<string, string> = {
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
  "aosta valley": "Valle d'Aosta",
  apulia: "Puglia",
  "emilia romagna": "Emilia-Romagna",
  "friuli venezia giulia": "Friuli-Venezia Giulia",
  latium: "Lazio",
  lombardy: "Lombardia",
  piedmont: "Piemonte",
  sardinia: "Sardegna",
  sicily: "Sicilia",
  tuscany: "Toscana",
  "trentino south tyrol": "Trentino-Alto Adige",
  "trentino alto adige south tyrol": "Trentino-Alto Adige",
  "valle d aosta": "Valle d'Aosta",
  venetia: "Veneto"
};

function compactAreaName(value: unknown) {
  return String(value || "")
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
}

const REGION_BY_COMPACT = Object.fromEntries(
  Object.keys(ITALIAN_REGION_CAPITALS).map((region) => [compactAreaName(region), region])
) as Record<string, string>;

const CAPITAL_TO_REGION = Object.fromEntries(
  Object.entries(ITALIAN_REGION_CAPITALS).map(([region, capital]) => [compactAreaName(capital), region])
) as Record<string, string>;

const PLACE_TO_REGION: Record<string, string> = {
  naples: "Campania",
  rome: "Lazio",
  milan: "Lombardia",
  turin: "Piemonte",
  florence: "Toscana",
  venice: "Veneto",
  "l aquila": "Abruzzo",
  aquila: "Abruzzo",
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
  "metropolitan city of cagliari": "Sardegna"
};

function resolveRegionFromParts(...parts: Array<unknown>) {
  for (const part of parts) {
    const compact = compactAreaName(part);
    if (!compact) continue;

    const directRegion = REGION_BY_COMPACT[compact] || REGION_ALIASES[compact];
    if (directRegion) return directRegion;
  }

  for (const part of parts) {
    const compact = compactAreaName(part);
    if (!compact) continue;

    const placeRegion = PLACE_TO_REGION[compact] || CAPITAL_TO_REGION[compact];
    if (placeRegion) return placeRegion;

    const stripped = compact
      .replace(/^(citta metropolitana di|metropolitan city of|provincia di|province of|provincia|province)\s+/, "")
      .trim();
    const strippedRegion = PLACE_TO_REGION[stripped] || CAPITAL_TO_REGION[stripped];
    if (strippedRegion) return strippedRegion;
  }

  return "";
}

export class BigDataCloudGeolocationProvider implements GeolocationProvider {
  async reverse(input: { latitude: number; longitude: number; language: "it" | "en" }) {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(input.latitude)}` +
      `&longitude=${encodeURIComponent(input.longitude)}` +
      `&localityLanguage=${encodeURIComponent(input.language)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Reverse geocoding non disponibile");
    }

    const data = await response.json() as {
      countryCode?: string;
      principalSubdivision?: string;
      localityInfo?: {
        administrative?: Array<{ name?: string }>;
      };
      city?: string;
      locality?: string;
    };
    const administrativeNames = data.localityInfo?.administrative?.map((item) => item.name) || [];
    const region = resolveRegionFromParts(data.principalSubdivision, data.city, data.locality, ...administrativeNames);
    const capitalCity = ITALIAN_REGION_CAPITALS[region] || data.city || data.locality || "Standard";

    return {
      countryCode: data.countryCode || null,
      region,
      capitalCity,
      city: data.city || data.locality || null
    };
  }
}
