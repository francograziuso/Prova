import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";
import { requireAuth } from "../middleware/auth";

export const lobbiesRouter = Router();

const lobbyCreateSchema = z.object({ difficulty: z.enum(["Facile", "Medio", "Difficile"]).default("Medio") });
const finishSchema = z.object({ score: z.number().int().min(0) });

lobbiesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = lobbyCreateSchema.parse(req.body);
    const lobby = await container.lobbies.create({ hostId: req.user!.id, difficulty: input.difficulty });
    res.status(201).json(lobby);
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.get("/:code", requireAuth, async (req, res, next) => {
  try {
    res.json(await container.lobbies.get(req.params.code));
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/join", requireAuth, async (req, res, next) => {
  try {
    res.json(await container.lobbies.join({ code: req.params.code, userId: req.user!.id }));
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/start", requireAuth, async (req, res, next) => {
  try {
    res.json(await container.lobbies.start({ code: req.params.code, userId: req.user!.id }));
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/finish", requireAuth, async (req, res, next) => {
  try {
    const { score } = finishSchema.parse(req.body);
    res.json(await container.lobbies.finish({ code: req.params.code, userId: req.user!.id, score }));
  } catch (error) {
    next(error);
  }
});
