import { Prisma } from "@prisma/client";
import type { SettingsInput, UserProfile } from "../../../domain/entities/types";
import { DomainError } from "../../../domain/errors/DomainError";
import type { UserRepository } from "../../../domain/repositories/UserRepository";
import { toUserProfile, toUserSettings } from "../mappers/userMapper";
import type { PrismaClientLike } from "../PrismaClientLike";

const profileInclude = { settings: true, purchases: true } as const;

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  async findByEmailOrUsername(email: string, username: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    return user ? toUserProfile(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<(UserProfile & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: profileInclude
    });
    return user ? { ...toUserProfile(user), passwordHash: user.passwordHash } : null;
  }

  async createRegisteredUser(input: { username: string; email: string; passwordHash: string }) {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          coins: 0,
          totalScore: 0,
          settings: { create: { localization: false, locationPromptSeen: false } },
          purchases: { create: { itemId: "tree_green" } }
        },
        include: profileInclude
      });
      return toUserProfile(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DomainError(409, "Email o username già registrato");
      }
      throw error;
    }
  }

  async findProfileById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: profileInclude
    });
    return user ? toUserProfile(user) : null;
  }

  async updateSettings(userId: number, input: SettingsInput) {
    const settings = await this.prisma.setting.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input }
    });
    return toUserSettings(settings);
  }

  async incrementStats(userId: number, input: { coins: number; score: number }) {
    const updated = await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        coins: { increment: input.coins },
        totalScore: { increment: input.score }
      }
    });

    if (updated.count !== 1) {
      throw new DomainError(404, "Utente non trovato");
    }

    const user = await this.findProfileById(userId);
    if (!user) throw new DomainError(404, "Utente non trovato");
    return user;
  }
}
