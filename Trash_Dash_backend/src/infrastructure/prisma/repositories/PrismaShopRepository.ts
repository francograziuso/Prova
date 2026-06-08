import type { PrismaClient } from "@prisma/client";
import type { ShopRepository } from "../../../domain/repositories/ShopRepository";
import { toUserProfile } from "../mappers/userMapper";

const profileInclude = { settings: true, purchases: true } as const;

export class PrismaShopRepository implements ShopRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findItems() {
    return this.prisma.item.findMany({ orderBy: { cost: "asc" } });
  }

  findItem(itemId: string) {
    return this.prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, cost: true }
    });
  }

  async hasPurchase(userId: number, itemId: string) {
    const purchase = await this.prisma.purchase.findUnique({ where: { userId_itemId: { userId, itemId } } });
    return Boolean(purchase);
  }

  async findUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: profileInclude });
    return user ? toUserProfile(user) : null;
  }

  async buyItem(input: { userId: number; itemId: string; cost: number }) {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        coins: { decrement: input.cost },
        purchases: { create: { itemId: input.itemId } }
      },
      include: profileInclude
    });
    return toUserProfile(user);
  }

  async equipItem(input: { userId: number; itemId: string }) {
    await this.prisma.setting.upsert({
      where: { userId: input.userId },
      update: { equippedItemId: input.itemId },
      create: { userId: input.userId, equippedItemId: input.itemId }
    });

    return this.findUserProfile(input.userId);
  }
}
