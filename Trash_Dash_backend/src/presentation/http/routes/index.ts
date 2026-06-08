import { Router } from "express";
import { authRouter } from "./auth.routes";
import { catalogRouter } from "./catalog.routes";
import { gamesRouter } from "./games.routes";
import { geolocationRouter } from "./geolocation.routes";
import { leaderboardRouter } from "./leaderboard.routes";
import { lobbiesRouter } from "./lobbies.routes";
import { meRouter } from "./me.routes";
import { shopRouter } from "./shop.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/me", meRouter);
router.use("/catalog", catalogRouter);
router.use("/games", gamesRouter);
router.use("/geolocation", geolocationRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/lobbies", lobbiesRouter);
router.use("/shop", shopRouter);
