import { DomainError } from "../../../domain/errors/DomainError";
import type { UserProfile } from "../../../domain/entities/types";
import type { ShopRepository } from "../../../domain/repositories/ShopRepository";
import { createPassthroughTransactionManager, type TransactionManager } from "../../ports/TransactionManager";

function profile(user: UserProfile | null) {
  return { user };
}

export function createShopUseCases(shop: ShopRepository, transactions?: TransactionManager) {
  const transactionManager = transactions ?? createPassthroughTransactionManager({ shop });

  return {
    async items() {
      const items = await shop.findItems();
      return { items };
    },

    async buy(userId: number, itemId: string) {
      return transactionManager.run(async (repositories) => {
        const item = await repositories.shop.findItem(itemId);
        if (!item) throw new DomainError(404, "Item non trovato");

        const result = await repositories.shop.buyItem({ userId, itemId, cost: item.cost });
        return profile(result.user);
      });
    },

    async equip(userId: number, itemId: string) {
      return transactionManager.run(async (repositories) => {
        const user = await repositories.shop.equipItem({ userId, itemId });
        if (!user) throw new DomainError(403, "Prima devi acquistare questo item");
        return profile(user);
      });
    }
  };
}
