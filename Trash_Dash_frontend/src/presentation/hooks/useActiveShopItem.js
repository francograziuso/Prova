import { useMemo } from "react";

export function useActiveShopItem(shopItems, equippedItemId) {
  return useMemo(
    () => shopItems.find((item) => item.id === equippedItemId) || shopItems[0],
    [shopItems, equippedItemId]
  );
}
