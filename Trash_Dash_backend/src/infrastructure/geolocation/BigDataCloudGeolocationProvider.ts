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

function cleanRegion(value: unknown) {
  return String(value || "").replace(/^Regione\s+/i, "").trim();
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
      city?: string;
      locality?: string;
    };
    const region = cleanRegion(data.principalSubdivision);
    const capitalCity = ITALIAN_REGION_CAPITALS[region] || data.city || data.locality || "Standard";

    return {
      countryCode: data.countryCode || null,
      region,
      capitalCity,
      city: data.city || data.locality || null
    };
  }
}
