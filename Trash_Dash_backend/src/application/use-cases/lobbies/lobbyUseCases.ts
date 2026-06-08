import type { Difficulty, LobbyStatus } from "../../../domain/entities/types";
import { DomainError } from "../../../domain/errors/DomainError";
import type { LobbyRepository } from "../../../domain/repositories/LobbyRepository";

type LobbyRecord = {
  code: string;
  hostId: number;
  guestId: number | null;
  status: LobbyStatus;
  hostScore: number | null;
  guestScore: number | null;
  expiresAt: Date;
};

function asLobby(value: unknown): LobbyRecord | null {
  return value as LobbyRecord | null;
}

function makeLobbyCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TD-";
  for (let i = 0; i < 4; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

async function createUniqueLobbyCode(lobbies: LobbyRepository) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = makeLobbyCode();
    if (!(await lobbies.existsByCode(code))) return code;
  }
  throw new DomainError(500, "Impossibile generare un codice lobby univoco");
}

export function createLobbyUseCases(lobbies: LobbyRepository, ttlMinutes: number) {
  async function getExistingLobby(code: string) {
    const lobby = asLobby(await lobbies.findByCode(code.toUpperCase()));
    if (!lobby) throw new DomainError(404, "Lobby non trovata");
    return lobby;
  }

  return {
    async create(input: { hostId: number; difficulty: Difficulty }) {
      const code = await createUniqueLobbyCode(lobbies);
      const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
      return lobbies.create({ code, hostId: input.hostId, difficulty: input.difficulty, expiresAt });
    },

    async get(code: string) {
      const lobby = await getExistingLobby(code);

      if (["WAITING", "READY"].includes(lobby.status) && lobby.expiresAt.getTime() < Date.now()) {
        return lobbies.markExpired(lobby.code);
      }

      return lobby;
    },

    async join(input: { code: string; userId: number }) {
      const code = input.code.toUpperCase();
      const lobby = await getExistingLobby(code);
      if (lobby.hostId === input.userId) throw new DomainError(400, "Non puoi sfidare te stesso");
      if (lobby.status !== "WAITING") throw new DomainError(409, "Lobby non disponibile");
      if (lobby.expiresAt.getTime() < Date.now()) throw new DomainError(410, "Lobby scaduta");

      const count = await lobbies.join({ code, guestId: input.userId });
      if (count !== 1) throw new DomainError(409, "Lobby non disponibile");

      return lobbies.findByCode(code);
    },

    async start(input: { code: string; userId: number }) {
      const code = input.code.toUpperCase();
      const lobby = await getExistingLobby(code);
      if (![lobby.hostId, lobby.guestId].includes(input.userId)) throw new DomainError(403, "Non partecipi a questa lobby");
      if (!lobby.guestId) throw new DomainError(409, "In attesa dell'avversario");

      return lobby.status === "IN_PROGRESS" ? lobbies.findByCode(code) : lobbies.start(code);
    },

    async finish(input: { code: string; userId: number; score: number }) {
      const code = input.code.toUpperCase();
      const lobby = await getExistingLobby(code);
      if (![lobby.hostId, lobby.guestId].includes(input.userId)) throw new DomainError(403, "Non partecipi a questa lobby");
      if (!lobby.guestId) throw new DomainError(409, "In attesa dell'avversario");

      if (lobby.status === "FINISHED") {
        return lobbies.findByCode(code);
      }

      if (lobby.status !== "IN_PROGRESS") throw new DomainError(409, "Scontro non in corso");

      const partiallyUpdated = asLobby(await lobbies.updateScore({ code, userId: input.userId, score: input.score }));
      if (!partiallyUpdated) throw new DomainError(404, "Lobby non trovata");

      if (partiallyUpdated.hostScore !== null && partiallyUpdated.guestScore !== null) {
        const hostScore = partiallyUpdated.hostScore ?? 0;
        const guestScore = partiallyUpdated.guestScore ?? 0;
        const winnerId = hostScore === guestScore ? null : hostScore > guestScore ? partiallyUpdated.hostId : partiallyUpdated.guestId;
        return lobbies.finish({ code, winnerId });
      }

      return partiallyUpdated;
    }
  };
}
