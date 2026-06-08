import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../../infrastructure/prisma/client";

export const catalogRouter = Router();

const rulesQuery = z.object({
  region: z.string().optional(),
  capitalCity: z.string().optional(),
  difficulty: z.enum(["Facile", "Medio", "Difficile"]).optional()
});

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

  return Object.keys(REGION_CAPITALS).find((region) => simplify(region) === key) || String(value || "").replace(/^Regione\s+/i, "").trim();
}

function normalizeCapital(region?: string, capitalCity?: string) {
  if (region && REGION_CAPITALS[region]) return REGION_CAPITALS[region];
  const value = String(capitalCity || "").trim();
  return value || undefined;
}

async function findDefaultRuleSet() {
  return prisma.ruleSet.findFirst({
    where: { isDefault: true },
    include: { wasteTypes: { include: { wastes: true } } }
  });
}

async function resolveRuleSet(region?: string, capitalCity?: string) {
  const normalizedRegion = normalizeRegion(region);
  const normalizedCapital = normalizeCapital(normalizedRegion, capitalCity);

  if (normalizedRegion && normalizedCapital) {
    const specific = await prisma.ruleSet.findFirst({
      where: {
        region: { equals: normalizedRegion, mode: "insensitive" },
        capitalCity: { equals: normalizedCapital, mode: "insensitive" }
      },
      include: { wasteTypes: { include: { wastes: true } } }
    });
    if (specific) return specific;
  }

  if (normalizedRegion) {
    const byRegion = await prisma.ruleSet.findFirst({
      where: {
        region: { equals: normalizedRegion, mode: "insensitive" },
        isDefault: false
      },
      include: { wasteTypes: { include: { wastes: true } } }
    });
    if (byRegion) return byRegion;
  }

  if (normalizedCapital) {
    const byCapital = await prisma.ruleSet.findFirst({
      where: {
        capitalCity: { equals: normalizedCapital, mode: "insensitive" },
        isDefault: false
      },
      include: { wasteTypes: { include: { wastes: true } } }
    });
    if (byCapital) return byCapital;
  }

  return findDefaultRuleSet();
}

function ruleSetSummary(ruleSet: Awaited<ReturnType<typeof resolveRuleSet>>) {
  return ruleSet ? {
    id: ruleSet.id,
    region: ruleSet.region,
    capitalCity: ruleSet.capitalCity,
    isDefault: ruleSet.isDefault
  } : null;
}

catalogRouter.get("/areas", async (_req, res, next) => {
  try {
    const areas = await prisma.ruleSet.findMany({
      where: { isDefault: false },
      orderBy: [{ region: "asc" }, { capitalCity: "asc" }],
      select: { region: true, capitalCity: true }
    });

    res.json({
      items: areas.map((area) => ({
        region: area.region,
        capitalCity: area.capitalCity
      }))
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/rules", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    const ruleSet = await resolveRuleSet(query.region, query.capitalCity);
    res.json({ ruleSet });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/bins", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    const ruleSet = await resolveRuleSet(query.region, query.capitalCity);
    res.json({
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
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/wastes", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    const ruleSet = await resolveRuleSet(query.region, query.capitalCity);
    const items = (ruleSet?.wasteTypes ?? []).flatMap((type) =>
      type.wastes
        .filter((waste) => !query.difficulty || waste.difficulty === query.difficulty)
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
    res.json({
      ruleSet: ruleSetSummary(ruleSet),
      items
    });
  } catch (error) {
    next(error);
  }
});
