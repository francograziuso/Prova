import type { PrismaClient } from "@prisma/client";
import type { SettingsInput, UserProfile } from "../../../domain/entities/types";
import type { UserRepository } from "../../../domain/repositories/UserRepository";
import { toUserProfile } from "../mappers/userMapper";

const profileInclude = { settings: true, purchases: true } as const;

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmailOrUsername(email: string, username: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
  }

  async findByEmailWithPassword(email: string): Promise<(UserProfile & { passwordHash: string }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: profileInclude
    });
    return user ? { ...toUserProfile(user), passwordHash: user.passwordHash } : null;
  }

  async createRegisteredUser(input: { username: string; email: string; passwordHash: string }) {
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
  }

  async findProfileById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: profileInclude
    });
    return user ? toUserProfile(user) : null;
  }

  updateSettings(userId: number, input: SettingsInput) {
    return this.prisma.setting.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input }
    });
  }

  async incrementStats(userId: number, input: { coins: number; score: number }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: input.coins },
        totalScore: { increment: input.score }
      },
      include: profileInclude
    });
    return toUserProfile(user);
  }
}
