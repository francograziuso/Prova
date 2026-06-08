import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";
import { requireAuth } from "../middleware/auth";

export const shopRouter = Router();

const itemSchema = z.object({ itemId: z.string().min(1) });

shopRouter.get("/items", async (_req, res, next) => {
  try {
    res.json(await container.shop.items());
  } catch (error) {
    next(error);
  }
});

shopRouter.post("/buy", requireAuth, async (req, res, next) => {
  try {
    const { itemId } = itemSchema.parse(req.body);
    res.json(await container.shop.buy(req.user!.id, itemId));
  } catch (error) {
    next(error);
  }
});

shopRouter.post("/equip", requireAuth, async (req, res, next) => {
  try {
    const { itemId } = itemSchema.parse(req.body);
    res.json(await container.shop.equip(req.user!.id, itemId));
  } catch (error) {
    next(error);
  }
});
