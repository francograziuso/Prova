import { Prisma } from "@prisma/client";
import { DomainError } from "../../../domain/errors/DomainError";
import type { BuyItemResult, ShopRepository } from "../../../domain/repositories/ShopRepository";
import { toUserProfile } from "../mappers/userMapper";
import type { PrismaClientLike } from "../PrismaClientLike";

const profileInclude = { settings: true, purchases: true } as const;

function isKnownPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export class PrismaShopRepository implements ShopRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  findItems() {
    return this.prisma.item.findMany({ orderBy: { cost: "asc" } });
  }

  findItem(itemId: string) {
    return this.prisma.item.findUnique({
      where: { id: itemId }
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

  async buyItem(input: { userId: number; itemId: string; cost: number }): Promise<BuyItemResult> {
    try {
      await this.prisma.purchase.create({
        data: { userId: input.userId, itemId: input.itemId }
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2002")) {
        return { status: "already-owned", user: await this.findUserProfile(input.userId) };
      }
      if (isKnownPrismaError(error, "P2003")) {
        throw new DomainError(404, "Utente o item non trovato");
      }
      throw error;
    }

    const updated = await this.prisma.user.updateMany({
      where: { id: input.userId, coins: { gte: input.cost } },
      data: { coins: { decrement: input.cost } }
    });

    if (updated.count !== 1) {
      throw new DomainError(400, "Monete insufficienti");
    }

    const user = await this.findUserProfile(input.userId);
    if (!user) throw new DomainError(404, "Utente non trovato");
    return { status: "purchased", user };
  }

  async equipItem(input: { userId: number; itemId: string }) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { userId_itemId: { userId: input.userId, itemId: input.itemId } }
    });

    if (!purchase) return null;

    try {
      await this.prisma.setting.upsert({
        where: { userId: input.userId },
        update: { equippedItemId: input.itemId },
        create: { userId: input.userId, equippedItemId: input.itemId }
      });
    } catch (error) {
      if (isKnownPrismaError(error, "P2003")) {
        throw new DomainError(404, "Utente o item non trovato");
      }
      throw error;
    }

    return this.findUserProfile(input.userId);
  }
}
