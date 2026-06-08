import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { env } from "../../../config/env";
import { prisma } from "../../../infrastructure/prisma/client";
import { HttpError } from "../../../utils/http";

export const lobbiesRouter = Router();

const lobbyCreateSchema = z.object({ difficulty: z.enum(["Facile", "Medio", "Difficile"]).default("Medio") });
const finishSchema = z.object({ score: z.number().int().min(0) });
const lobbyInclude = {
  host: { select: { id: true, username: true } },
  guest: { select: { id: true, username: true } }
} as const;

function makeLobbyCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TD-";
  for (let i = 0; i < 4; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

async function createUniqueLobbyCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = makeLobbyCode();
    const existing = await prisma.lobby.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new HttpError(500, "Impossibile generare un codice lobby univoco");
}

lobbiesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = lobbyCreateSchema.parse(req.body);
    const code = await createUniqueLobbyCode();
    const expiresAt = new Date(Date.now() + env.LOBBY_TTL_MINUTES * 60_000);

    const lobby = await prisma.lobby.create({
      data: { code, hostId: req.user!.id, difficulty: input.difficulty, expiresAt },
      include: lobbyInclude
    });

    res.status(201).json(lobby);
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.get("/:code", requireAuth, async (req, res, next) => {
  try {
    let lobby = await prisma.lobby.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: lobbyInclude
    });
    if (!lobby) throw new HttpError(404, "Lobby non trovata");

    if (["WAITING", "READY"].includes(lobby.status) && lobby.expiresAt.getTime() < Date.now()) {
      lobby = await prisma.lobby.update({
        where: { code: lobby.code },
        data: { status: "EXPIRED" },
        include: lobbyInclude
      });
    }

    res.json(lobby);
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/join", requireAuth, async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const lobby = await prisma.lobby.findUnique({ where: { code } });
    if (!lobby) throw new HttpError(404, "Lobby non trovata");
    if (lobby.hostId === req.user!.id) throw new HttpError(400, "Non puoi sfidare te stesso");
    if (lobby.status !== "WAITING") throw new HttpError(409, "Lobby non disponibile");
    if (lobby.expiresAt.getTime() < Date.now()) throw new HttpError(410, "Lobby scaduta");

    const joinResult = await prisma.lobby.updateMany({
      where: { code, status: "WAITING", guestId: null },
      data: { guestId: req.user!.id, status: "IN_PROGRESS" }
    });

    if (joinResult.count !== 1) throw new HttpError(409, "Lobby non disponibile");

    const updated = await prisma.lobby.findUnique({
      where: { code },
      include: lobbyInclude
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/start", requireAuth, async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const lobby = await prisma.lobby.findUnique({ where: { code } });
    if (!lobby) throw new HttpError(404, "Lobby non trovata");
    if (![lobby.hostId, lobby.guestId].includes(req.user!.id)) throw new HttpError(403, "Non partecipi a questa lobby");
    if (!lobby.guestId) throw new HttpError(409, "In attesa dell'avversario");

    const updated = lobby.status === "IN_PROGRESS"
      ? await prisma.lobby.findUnique({ where: { code }, include: lobbyInclude })
      : await prisma.lobby.update({ where: { code }, data: { status: "IN_PROGRESS" }, include: lobbyInclude });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

lobbiesRouter.post("/:code/finish", requireAuth, async (req, res, next) => {
  try {
    const { score } = finishSchema.parse(req.body);
    const code = req.params.code.toUpperCase();
    const lobby = await prisma.lobby.findUnique({ where: { code } });
    if (!lobby) throw new HttpError(404, "Lobby non trovata");
    if (![lobby.hostId, lobby.guestId].includes(req.user!.id)) throw new HttpError(403, "Non partecipi a questa lobby");
    if (!lobby.guestId) throw new HttpError(409, "In attesa dell'avversario");

    if (lobby.status === "FINISHED") {
      const finished = await prisma.lobby.findUnique({ where: { code }, include: lobbyInclude });
      res.json(finished);
      return;
    }

    if (lobby.status !== "IN_PROGRESS") throw new HttpError(409, "Scontro non in corso");

    const data =
      req.user!.id === lobby.hostId
        ? lobby.hostScore === null ? { hostScore: score } : {}
        : lobby.guestScore === null ? { guestScore: score } : {};

    const partiallyUpdated = Object.keys(data).length > 0
      ? await prisma.lobby.update({ where: { code }, data, include: lobbyInclude })
      : await prisma.lobby.findUnique({ where: { code }, include: lobbyInclude });

    if (!partiallyUpdated) throw new HttpError(404, "Lobby non trovata");

    let finalLobby = partiallyUpdated;
    if (finalLobby.hostScore !== null && finalLobby.guestScore !== null) {
      const hostScore = finalLobby.hostScore ?? 0;
      const guestScore = finalLobby.guestScore ?? 0;
      const winnerId = hostScore === guestScore ? null : hostScore > guestScore ? finalLobby.hostId : finalLobby.guestId;
      finalLobby = await prisma.lobby.update({
        where: { code },
        data: { winnerId, status: "FINISHED" },
        include: lobbyInclude
      });
    }

    res.json(finalLobby);
  } catch (error) {
    next(error);
  }
});
