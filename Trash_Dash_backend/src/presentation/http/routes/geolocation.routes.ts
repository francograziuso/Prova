import { Router } from "express";
import { z } from "zod";
import { container } from "../../../main/container";

export const geolocationRouter = Router();

const reverseSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  language: z.enum(["it", "en"]).default("it")
});

geolocationRouter.get("/reverse", async (req, res, next) => {
  try {
    const input = reverseSchema.parse(req.query);
    res.json(await container.geolocation.reverse(input));
  } catch (error) {
    next(error);
  }
});
