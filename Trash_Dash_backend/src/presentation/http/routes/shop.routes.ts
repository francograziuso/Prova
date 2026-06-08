import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../../../infrastructure/prisma/client";
import { HttpError } from "../../../utils/http";

export const shopRouter = Router();

const itemSchema = z.object({ itemId: z.string().min(1) });

function profile(user: any) {
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      totalScore: user.totalScore,
      settings: user.settings,
      purchases: user.purchases ?? []
    }
  };
}

shopRouter.get("/items", async (_req, res, next) => {
  try {
    const items = await prisma.item.findMany({ orderBy: { cost: "asc" } });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

shopRouter.post("/buy", requireAuth, async (req, res, next) => {
  try {
    const { itemId } = itemSchema.parse(req.body);
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new HttpError(404, "Item non trovato");

    const already = await prisma.purchase.findUnique({ where: { userId_itemId: { userId: req.user!.id, itemId } } });
    if (already) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { settings: true, purchases: true } });
      return res.json(profile(user));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.coins < item.cost) throw new HttpError(400, "Monete insufficienti");

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        coins: { decrement: item.cost },
        purchases: { create: { itemId } }
      },
      include: { settings: true, purchases: true }
    });

    res.json(profile(updated));
  } catch (error) {
    next(error);
  }
});

shopRouter.post("/equip", requireAuth, async (req, res, next) => {
  try {
    const { itemId } = itemSchema.parse(req.body);
    const purchase = await prisma.purchase.findUnique({ where: { userId_itemId: { userId: req.user!.id, itemId } } });
    if (!purchase) throw new HttpError(403, "Prima devi acquistare questo item");

    await prisma.setting.upsert({
      where: { userId: req.user!.id },
      update: { equippedItemId: itemId },
      create: { userId: req.user!.id, equippedItemId: itemId }
    });

    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { settings: true, purchases: true } });
    res.json(profile(user));
  } catch (error) {
    next(error);
  }
});
