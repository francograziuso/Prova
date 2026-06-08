import { DomainError } from "../../../domain/errors/DomainError";
import type { ShopRepository } from "../../../domain/repositories/ShopRepository";

function profile(user: unknown) {
  return { user };
}

export function createShopUseCases(shop: ShopRepository) {
  return {
    async items() {
      const items = await shop.findItems();
      return { items };
    },

    async buy(userId: number, itemId: string) {
      const item = await shop.findItem(itemId);
      if (!item) throw new DomainError(404, "Item non trovato");

      if (await shop.hasPurchase(userId, itemId)) {
        const user = await shop.findUserProfile(userId);
        return profile(user);
      }

      const currentUser = await shop.findUserProfile(userId);
      if (!currentUser || currentUser.coins < item.cost) {
        throw new DomainError(400, "Monete insufficienti");
      }

      const updated = await shop.buyItem({ userId, itemId, cost: item.cost });
      return profile(updated);
    },

    async equip(userId: number, itemId: string) {
      if (!(await shop.hasPurchase(userId, itemId))) {
        throw new DomainError(403, "Prima devi acquistare questo item");
      }

      const user = await shop.equipItem({ userId, itemId });
      return profile(user);
    }
  };
}
