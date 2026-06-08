import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";

export const catalogRouter = Router();

const rulesQuery = z.object({
  region: z.string().optional(),
  capitalCity: z.string().optional(),
  difficulty: z.enum(["Facile", "Medio", "Difficile"]).optional()
});

catalogRouter.get("/areas", async (_req, res, next) => {
  try {
    res.json(await container.catalog.areas());
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/rules", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    res.json(await container.catalog.rules(query));
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/bins", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    res.json(await container.catalog.bins(query));
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/wastes", async (req, res, next) => {
  try {
    const query = rulesQuery.parse(req.query);
    res.json(await container.catalog.wastes(query));
  } catch (error) {
    next(error);
  }
});
