import { Prisma, type PrismaClient } from "@prisma/client";
import type { TransactionalRepositories, TransactionManager } from "../../application/ports/TransactionManager";
import { PrismaGameRepository } from "./repositories/PrismaGameRepository";
import { PrismaLobbyRepository } from "./repositories/PrismaLobbyRepository";
import { PrismaShopRepository } from "./repositories/PrismaShopRepository";
import { PrismaUserRepository } from "./repositories/PrismaUserRepository";

const MAX_SERIALIZABLE_RETRIES = 2;

function isSerializableConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt <= MAX_SERIALIZABLE_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) =>
            work({
              games: new PrismaGameRepository(tx),
              lobbies: new PrismaLobbyRepository(tx),
              shop: new PrismaShopRepository(tx),
              users: new PrismaUserRepository(tx)
            }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );
      } catch (error) {
        if (attempt < MAX_SERIALIZABLE_RETRIES && isSerializableConflict(error)) continue;
        throw error;
      }
    }

    throw new Error("Transazione non completata");
  }
}
