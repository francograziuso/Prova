import type { Difficulty, LobbyRecord } from "../../../domain/entities/types";
import { DomainError } from "../../../domain/errors/DomainError";
import type { LobbyRepository } from "../../../domain/repositories/LobbyRepository";
import { createLobbyCode, normalizeLobbyCode } from "../../../domain/value-objects/lobbyCode";
import { createPassthroughTransactionManager, type TransactionManager } from "../../ports/TransactionManager";

export function createLobbyUseCases(lobbies: LobbyRepository, ttlMinutes: number, transactions?: TransactionManager) {
  const transactionManager = transactions ?? createPassthroughTransactionManager({ lobbies });

  async function getExistingLobby(repository: LobbyRepository, code: string) {
    const lobby = await repository.findByCode(normalizeLobbyCode(code));
    if (!lobby) throw new DomainError(404, "Lobby non trovata");
    return lobby;
  }

  return {
    async create(input: { hostId: number; difficulty: Difficulty }) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          return await transactionManager.run(async (repositories) => {
            const code = createLobbyCode();
            const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
            return repositories.lobbies.create({ code, hostId: input.hostId, difficulty: input.difficulty, expiresAt });
          });
        } catch (error) {
          if (error instanceof DomainError && error.status === 409) continue;
          throw error;
        }
      }

      throw new DomainError(500, "Impossibile generare un codice lobby univoco");
    },

    async get(code: string) {
      const lobby = await getExistingLobby(lobbies, code);

      if (["WAITING", "READY"].includes(lobby.status) && lobby.expiresAt.getTime() < Date.now()) {
        return lobbies.markExpired(lobby.code);
      }

      return lobby;
    },

    async join(input: { code: string; userId: number }) {
      const code = normalizeLobbyCode(input.code);

      return transactionManager.run(async (repositories) => {
        const lobby = await getExistingLobby(repositories.lobbies, code);
        if (lobby.hostId === input.userId) throw new DomainError(400, "Non puoi sfidare te stesso");
        if (lobby.status !== "WAITING") throw new DomainError(409, "Lobby non disponibile");
        if (lobby.expiresAt.getTime() < Date.now()) throw new DomainError(410, "Lobby scaduta");

        const count = await repositories.lobbies.join({ code, guestId: input.userId });
        if (count !== 1) throw new DomainError(409, "Lobby non disponibile");

        return repositories.lobbies.findByCode(code);
      });
    },

    async start(input: { code: string; userId: number }) {
      const code = normalizeLobbyCode(input.code);
      const lobby = await getExistingLobby(lobbies, code);
      if (![lobby.hostId, lobby.guestId].includes(input.userId)) throw new DomainError(403, "Non partecipi a questa lobby");
      if (!lobby.guestId) throw new DomainError(409, "In attesa dell'avversario");

      return lobby.status === "IN_PROGRESS" ? lobbies.findByCode(code) : lobbies.start(code);
    },

    async finish(input: { code: string; userId: number; score: number }) {
      const code = normalizeLobbyCode(input.code);

      return transactionManager.run(async (repositories) => {
        const lobby = await repositories.lobbies.findByCode(code);
        if (!lobby) throw new DomainError(404, "Lobby non trovata");
        if (![lobby.hostId, lobby.guestId].includes(input.userId)) throw new DomainError(403, "Non partecipi a questa lobby");
        if (!lobby.guestId) throw new DomainError(409, "In attesa dell'avversario");
        if (lobby.status === "FINISHED") return repositories.lobbies.findByCode(code);
        if (lobby.status !== "IN_PROGRESS") throw new DomainError(409, "Scontro non in corso");

        const updated = await repositories.lobbies.recordScoreAndMaybeFinish({ code, userId: input.userId, score: input.score });
        if (!updated) throw new DomainError(404, "Lobby non trovata");
        return updated;
      });
    }
  };
}
