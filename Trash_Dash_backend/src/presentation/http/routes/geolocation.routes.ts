import { Router } from "express";
import { z } from "zod";

export const geolocationRouter = Router();

const reverseSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  language: z.enum(["it", "en"]).default("it")
});

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

geolocationRouter.get("/reverse", async (req, res, next) => {
  try {
    const input = reverseSchema.parse(req.query);
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(input.latitude)}` +
      `&longitude=${encodeURIComponent(input.longitude)}` +
      `&localityLanguage=${encodeURIComponent(input.language)}`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: "Reverse geocoding non disponibile" });
    }

    const data: any = await response.json();
    const region = cleanRegion(data.principalSubdivision);
    const capitalCity = ITALIAN_REGION_CAPITALS[region] || data.city || data.locality || "Standard";

    res.json({
      countryCode: data.countryCode || null,
      region,
      capitalCity,
      city: data.city || data.locality || null
    });
  } catch (error) {
    next(error);
  }
});
