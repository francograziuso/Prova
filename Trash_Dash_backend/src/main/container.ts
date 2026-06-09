import { env } from "../config/env";
import { createAuthUseCases } from "../application/use-cases/auth/authUseCases";
import { createCatalogUseCases } from "../application/use-cases/catalog/catalogUseCases";
import { createGameUseCases } from "../application/use-cases/games/gameUseCases";
import { createGeolocationUseCases } from "../application/use-cases/geolocation/geolocationUseCases";
import { createLeaderboardUseCases } from "../application/use-cases/leaderboard/leaderboardUseCases";
import { createLobbyUseCases } from "../application/use-cases/lobbies/lobbyUseCases";
import { createShopUseCases } from "../application/use-cases/shop/shopUseCases";
import { createUserUseCases } from "../application/use-cases/users/userUseCases";
import { JwtTokenService } from "../infrastructure/auth/JwtTokenService";
import { BigDataCloudGeolocationProvider } from "../infrastructure/geolocation/BigDataCloudGeolocationProvider";
import { prisma } from "../infrastructure/prisma/client";
import { PrismaTransactionManager } from "../infrastructure/prisma/PrismaTransactionManager";
import { PrismaCatalogRepository } from "../infrastructure/prisma/repositories/PrismaCatalogRepository";
import { PrismaGameRepository } from "../infrastructure/prisma/repositories/PrismaGameRepository";
import { PrismaLeaderboardRepository } from "../infrastructure/prisma/repositories/PrismaLeaderboardRepository";
import { PrismaLobbyRepository } from "../infrastructure/prisma/repositories/PrismaLobbyRepository";
import { PrismaShopRepository } from "../infrastructure/prisma/repositories/PrismaShopRepository";
import { PrismaUserRepository } from "../infrastructure/prisma/repositories/PrismaUserRepository";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher";

const userRepository = new PrismaUserRepository(prisma);
const gameRepository = new PrismaGameRepository(prisma);
const catalogRepository = new PrismaCatalogRepository(prisma);
const leaderboardRepository = new PrismaLeaderboardRepository(prisma);
const shopRepository = new PrismaShopRepository(prisma);
const lobbyRepository = new PrismaLobbyRepository(prisma);
const transactionManager = new PrismaTransactionManager(prisma);

export const container = {
  auth: createAuthUseCases({
    users: userRepository,
    passwordHasher: new BcryptPasswordHasher(),
    tokenService: new JwtTokenService()
  }),
  users: createUserUseCases(userRepository),
  games: createGameUseCases(gameRepository, userRepository, transactionManager),
  catalog: createCatalogUseCases(catalogRepository),
  leaderboard: createLeaderboardUseCases(leaderboardRepository),
  shop: createShopUseCases(shopRepository, transactionManager),
  lobbies: createLobbyUseCases(lobbyRepository, env.LOBBY_TTL_MINUTES, transactionManager),
  geolocation: createGeolocationUseCases(new BigDataCloudGeolocationProvider())
};
