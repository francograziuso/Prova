import type { Difficulty } from "../../../domain/entities/types";
import type { LobbyRepository } from "../../../domain/repositories/LobbyRepository";
import { determineBattleWinner } from "../../../domain/value-objects/gameResult";
import type { PrismaClientLike } from "../PrismaClientLike";

const lobbyInclude = {
  host: { select: { id: true, username: true } },
  guest: { select: { id: true, username: true } }
} as const;

export class PrismaLobbyRepository implements LobbyRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  findByCode(code: string) {
    return this.prisma.lobby.findUnique({ where: { code }, include: lobbyInclude });
  }

  async existsByCode(code: string) {
    const lobby = await this.prisma.lobby.findUnique({ where: { code }, select: { id: true } });
    return Boolean(lobby);
  }

  create(input: { code: string; hostId: number; difficulty: Difficulty; expiresAt: Date }) {
    return this.prisma.lobby.create({
      data: input,
      include: lobbyInclude
    });
  }

  markExpired(code: string) {
    return this.prisma.lobby.update({
      where: { code },
      data: { status: "EXPIRED" },
      include: lobbyInclude
    });
  }

  async join(input: { code: string; guestId: number }) {
    const result = await this.prisma.lobby.updateMany({
      where: { code: input.code, status: "WAITING", guestId: null },
      data: { guestId: input.guestId, status: "IN_PROGRESS" }
    });
    return result.count;
  }

  start(code: string) {
    return this.prisma.lobby.update({
      where: { code },
      data: { status: "IN_PROGRESS" },
      include: lobbyInclude
    });
  }

  async updateScore(input: { code: string; userId: number; score: number }) {
    const lobby = await this.prisma.lobby.findUnique({ where: { code: input.code } });
    if (!lobby) return null;

    const data =
      input.userId === lobby.hostId
        ? lobby.hostScore === null ? { hostScore: input.score } : {}
        : lobby.guestScore === null ? { guestScore: input.score } : {};

    if (Object.keys(data).length === 0) {
      return this.findByCode(input.code);
    }

    return this.prisma.lobby.update({
      where: { code: input.code },
      data,
      include: lobbyInclude
    });
  }

  async recordScoreAndMaybeFinish(input: { code: string; userId: number; score: number }) {
    const lobby = await this.prisma.lobby.findUnique({ where: { code: input.code } });
    if (!lobby) return null;

    if (lobby.status === "FINISHED") return this.findByCode(input.code);
    if (lobby.status !== "IN_PROGRESS") return this.findByCode(input.code);

    if (input.userId === lobby.hostId) {
      await this.prisma.lobby.updateMany({
        where: { code: input.code, hostScore: null },
        data: { hostScore: input.score }
      });
    } else if (input.userId === lobby.guestId) {
      await this.prisma.lobby.updateMany({
        where: { code: input.code, guestScore: null },
        data: { guestScore: input.score }
      });
    }

    const updated = await this.prisma.lobby.findUnique({ where: { code: input.code } });
    if (!updated) return null;

    if (updated.status === "IN_PROGRESS" && updated.hostScore !== null && updated.guestScore !== null) {
      const winnerId = determineBattleWinner({
        hostId: updated.hostId,
        guestId: updated.guestId,
        hostScore: updated.hostScore,
        guestScore: updated.guestScore
      });

      await this.prisma.lobby.updateMany({
        where: { code: input.code, status: "IN_PROGRESS" },
        data: { winnerId, status: "FINISHED" }
      });
    }

    return this.findByCode(input.code);
  }

  finish(input: { code: string; winnerId: number | null }) {
    return this.prisma.lobby.update({
      where: { code: input.code },
      data: { winnerId: input.winnerId, status: "FINISHED" },
      include: lobbyInclude
    });
  }
}
