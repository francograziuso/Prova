import assert from "node:assert/strict";
import { createAuthUseCases } from "../src/application/use-cases/auth/authUseCases";
import { calculateCoinsEarned, createGameUseCases } from "../src/application/use-cases/games/gameUseCases";
import { createGeolocationUseCases } from "../src/application/use-cases/geolocation/geolocationUseCases";
import { createLeaderboardUseCases } from "../src/application/use-cases/leaderboard/leaderboardUseCases";
import { createLobbyUseCases } from "../src/application/use-cases/lobbies/lobbyUseCases";
import { createShopUseCases } from "../src/application/use-cases/shop/shopUseCases";
import type { GeolocationProvider } from "../src/application/ports/GeolocationProvider";
import type { PasswordHasher, TokenService } from "../src/application/ports/SecurityPorts";
import type { TransactionalRepositories, TransactionManager } from "../src/application/ports/TransactionManager";
import type { Difficulty, GameRecord, GameSubmitInput, LobbyStatus, PublicLeaderboardUser, SettingsInput, ShopItem, UserProfile } from "../src/domain/entities/types";
import type { GameRepository } from "../src/domain/repositories/GameRepository";
import type { LeaderboardRepository } from "../src/domain/repositories/LeaderboardRepository";
import type { LobbyRepository } from "../src/domain/repositories/LobbyRepository";
import type { ShopRepository } from "../src/domain/repositories/ShopRepository";
import type { UserRepository } from "../src/domain/repositories/UserRepository";

class InMemoryUserRepository implements UserRepository {
  private nextId = 1;
  private users = new Map<number, UserProfile & { passwordHash: string }>();

  async findByEmailOrUsername(email: string, username: string) {
    return [...this.users.values()].find(
      (user) => user.email === email || user.username === username
    ) ?? null;
  }

  async findByEmailWithPassword(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async createRegisteredUser(input: { username: string; email: string; passwordHash: string }) {
    const user: UserProfile & { passwordHash: string } = {
      id: this.nextId++,
      username: input.username,
      email: input.email,
      passwordHash: input.passwordHash,
      coins: 0,
      totalScore: 0,
      settings: {
        localization: false,
        locationPromptSeen: false,
        language: "IT",
        equippedItemId: "tree_green"
      },
      purchases: []
    };
    this.users.set(user.id, user);

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async findProfileById(userId: number) {
    const user = this.users.get(userId);
    if (!user) return null;
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async updateSettings(userId: number, input: SettingsInput) {
    const user = this.users.get(userId);
    if (!user) return null;
    user.settings = { ...(user.settings as object), ...input };
    return user.settings;
  }

  async incrementStats(userId: number, input: { coins: number; score: number }) {
    const user = this.users.get(userId);
    assert.ok(user, "Utente test non trovato");
    user.coins += input.coins;
    user.totalScore += input.score;
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}

class FailingStatsUserRepository implements UserRepository {
  constructor(private readonly delegate: UserRepository) {}

  findByEmailOrUsername(email: string, username: string) {
    return this.delegate.findByEmailOrUsername(email, username);
  }

  findByEmailWithPassword(email: string) {
    return this.delegate.findByEmailWithPassword(email);
  }

  createRegisteredUser(input: { username: string; email: string; passwordHash: string }) {
    return this.delegate.createRegisteredUser(input);
  }

  findProfileById(userId: number) {
    return this.delegate.findProfileById(userId);
  }

  updateSettings(userId: number, input: SettingsInput) {
    return this.delegate.updateSettings(userId, input);
  }

  async incrementStats() {
    throw new Error("stats write failed");
  }
}

class InMemoryGameRepository implements GameRepository {
  public created: GameRecord[] = [];

  async create(input: GameSubmitInput & { coinsEarned: number }) {
    const game: GameRecord = {
      id: this.created.length + 1,
      userId: input.userId ?? null,
      mode: input.mode,
      difficulty: input.difficulty,
      score: input.score,
      status: input.status,
      livesRemaining: input.livesRemaining ?? null,
      durationSeconds: input.durationSeconds ?? null,
      errors: input.errors,
      coinsEarned: input.coinsEarned,
      region: input.region ?? null,
      capitalCity: input.capitalCity ?? null,
      createdAt: new Date()
    };
    this.created.push(game);
    return game;
  }

  async findRecentByUserId(_userId: number, _limit: number) {
    return this.created;
  }
}

class GameRollbackTransactionManager implements TransactionManager {
  constructor(private readonly committedGames: InMemoryGameRepository, private readonly users: UserRepository) {}

  async run<T>(work: (repositories: TransactionalRepositories) => Promise<T>): Promise<T> {
    const stagedGames = new InMemoryGameRepository();
    const result = await work({
      games: stagedGames,
      users: this.users,
      lobbies: {} as LobbyRepository,
      shop: {} as ShopRepository
    });

    this.committedGames.created.push(...stagedGames.created);
    return result;
  }
}

class InMemoryLeaderboardRepository implements LeaderboardRepository {
  constructor(private readonly users: Array<PublicLeaderboardUser & { email: string }>) {}

  async findTopUsers(input: { limit: number; excludedEmail: string }) {
    return this.users
      .filter((user) => user.email !== input.excludedEmail)
      .sort((left, right) => right.totalScore - left.totalScore)
      .slice(0, input.limit);
  }

  async countUsersAtOrAboveScore(input: { score: number; excludedEmail: string }) {
    return this.users.filter(
      (user) => user.email !== input.excludedEmail && user.totalScore >= input.score
    ).length;
  }
}

class InMemoryShopRepository implements ShopRepository {
  private items = new Map([
    ["tree_green", { id: "tree_green", name: "Base", type: "Estetico", cost: 0, iconHealthy: "🌳", iconDead: "🪾" }],
    ["tree_moon", { id: "tree_moon", name: "Moon", type: "Estetico", cost: 50, iconHealthy: "🌙", iconDead: "🌑" }],
    ["tree_prism", { id: "tree_prism", name: "Prism", type: "Estetico", cost: 500, iconHealthy: "💎", iconDead: "🪨" }]
  ]);
  private users = new Map<number, UserProfile>();
  private purchases = new Set<string>();

  addUser(user: UserProfile) {
    this.users.set(user.id, user);
  }

  async findItems(): Promise<ShopItem[]> {
    return [...this.items.values()];
  }

  async findItem(itemId: string) {
    return this.items.get(itemId) ?? null;
  }

  async hasPurchase(userId: number, itemId: string) {
    return this.purchases.has(`${userId}:${itemId}`);
  }

  async findUserProfile(userId: number) {
    return this.users.get(userId) ?? null;
  }

  async buyItem(input: { userId: number; itemId: string; cost: number }) {
    const user = this.users.get(input.userId);
    assert.ok(user, "Utente shop test non trovato");
    if (this.purchases.has(`${input.userId}:${input.itemId}`)) return { status: "already-owned" as const, user };
    if (user.coins < input.cost) throw new Error("Monete insufficienti");
    user.coins -= input.cost;
    this.purchases.add(`${input.userId}:${input.itemId}`);
    return { status: "purchased" as const, user };
  }

  async equipItem(input: { userId: number; itemId: string }) {
    const user = this.users.get(input.userId);
    if (!user) return null;
    if (!this.purchases.has(`${input.userId}:${input.itemId}`)) return null;
    user.settings = { ...(user.settings as object), equippedItemId: input.itemId };
    return user;
  }
}

type MemoryLobby = {
  code: string;
  hostId: number;
  guestId: number | null;
  difficulty: Difficulty;
  status: LobbyStatus;
  hostScore: number | null;
  guestScore: number | null;
  winnerId: number | null;
  expiresAt: Date;
};

class InMemoryLobbyRepository implements LobbyRepository {
  private lobbies = new Map<string, MemoryLobby>();

  async findByCode(code: string) {
    return this.lobbies.get(code) ?? null;
  }

  async existsByCode(code: string) {
    return this.lobbies.has(code);
  }

  async create(input: { code: string; hostId: number; difficulty: Difficulty; expiresAt: Date }) {
    const lobby: MemoryLobby = {
      code: input.code,
      hostId: input.hostId,
      guestId: null,
      difficulty: input.difficulty,
      status: "WAITING",
      hostScore: null,
      guestScore: null,
      winnerId: null,
      expiresAt: input.expiresAt
    };
    this.lobbies.set(lobby.code, lobby);
    return lobby;
  }

  async markExpired(code: string) {
    const lobby = this.lobbies.get(code);
    assert.ok(lobby, "Lobby test non trovata");
    lobby.status = "EXPIRED";
    return lobby;
  }

  async join(input: { code: string; guestId: number }) {
    const lobby = this.lobbies.get(input.code);
    if (!lobby || lobby.status !== "WAITING" || lobby.guestId !== null) return 0;
    lobby.guestId = input.guestId;
    lobby.status = "IN_PROGRESS";
    return 1;
  }

  async start(code: string) {
    const lobby = this.lobbies.get(code);
    assert.ok(lobby, "Lobby test non trovata");
    lobby.status = "IN_PROGRESS";
    return lobby;
  }

  async updateScore(input: { code: string; userId: number; score: number }) {
    const lobby = this.lobbies.get(input.code);
    if (!lobby) return null;
    if (input.userId === lobby.hostId && lobby.hostScore === null) lobby.hostScore = input.score;
    if (input.userId === lobby.guestId && lobby.guestScore === null) lobby.guestScore = input.score;
    return lobby;
  }

  async recordScoreAndMaybeFinish(input: { code: string; userId: number; score: number }) {
    const lobby = this.lobbies.get(input.code);
    if (!lobby) return null;
    if (lobby.status !== "IN_PROGRESS") return lobby;

    if (input.userId === lobby.hostId && lobby.hostScore === null) lobby.hostScore = input.score;
    if (input.userId === lobby.guestId && lobby.guestScore === null) lobby.guestScore = input.score;

    if (lobby.hostScore !== null && lobby.guestScore !== null) {
      lobby.status = "FINISHED";
      lobby.winnerId =
        lobby.hostScore === lobby.guestScore
          ? null
          : lobby.hostScore > lobby.guestScore
          ? lobby.hostId
          : lobby.guestId;
    }

    return lobby;
  }

  async finish(input: { code: string; winnerId: number | null }) {
    const lobby = this.lobbies.get(input.code);
    assert.ok(lobby, "Lobby test non trovata");
    lobby.status = "FINISHED";
    lobby.winnerId = input.winnerId;
    return lobby;
  }
}

const passwordHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`
};

const tokenService: TokenService = {
  sign: (user) => `token:${user.id}:${user.email}`
};

async function testAuthUseCases() {
  const users = new InMemoryUserRepository();
  const auth = createAuthUseCases({ users, passwordHasher, tokenService });

  const registered = await auth.register({
    username: "Mario",
    email: "MARIO@EXAMPLE.COM",
    password: "password123"
  });

  assert.equal(registered.user.email, "mario@example.com");
  assert.equal(registered.user.coins, 0);
  assert.equal("passwordHash" in registered.user, false);
  assert.match(registered.token, /^token:/);

  await assert.rejects(
    () => auth.register({ username: "Mario2", email: "mario@example.com", password: "password123" }),
    /Email o username/
  );

  const loggedIn = await auth.login({ email: "mario@example.com", password: "password123" });
  assert.equal(loggedIn.user.username, "Mario");
  assert.equal("passwordHash" in loggedIn.user, false);

  await assert.rejects(
    () => auth.login({ email: "mario@example.com", password: "errata" }),
    /Credenziali/
  );
}

async function testGameUseCases() {
  const users = new InMemoryUserRepository();
  const games = new InMemoryGameRepository();
  const auth = createAuthUseCases({ users, passwordHasher, tokenService });
  const registered = await auth.register({
    username: "Giulia",
    email: "giulia@example.com",
    password: "password123"
  });

  assert.equal(calculateCoinsEarned("WIN", 999, "Facile"), 5);
  assert.equal(calculateCoinsEarned("WIN", 999, "Medio"), 20);
  assert.equal(calculateCoinsEarned("WIN", 999, "Difficile"), 35);
  assert.equal(calculateCoinsEarned("LOSE", 999, "Difficile"), 0);

  const useCases = createGameUseCases(games, users);
  const submitted = await useCases.submit({
    userId: registered.user.id,
    mode: "SINGLE",
    difficulty: "Facile",
    score: 99,
    status: "WIN",
    errors: []
  });

  assert.equal(submitted.user?.coins, 5);
  assert.equal(submitted.user?.totalScore, 99);

  const guestSubmitted = await useCases.submit({
    mode: "SINGLE",
    difficulty: "Difficile",
    score: 99,
    status: "WIN",
    errors: []
  });
  assert.equal(guestSubmitted.user, null);

  const rollbackGames = new InMemoryGameRepository();
  const rollbackUseCases = createGameUseCases(
    rollbackGames,
    users,
    new GameRollbackTransactionManager(rollbackGames, new FailingStatsUserRepository(users))
  );

  await assert.rejects(
    () =>
      rollbackUseCases.submit({
        userId: registered.user.id,
        mode: "SINGLE",
        difficulty: "Medio",
        score: 123,
        status: "WIN",
        errors: []
      }),
    /stats write failed/
  );
  assert.equal(rollbackGames.created.length, 0);
}

async function testLeaderboardUseCases() {
  const leaderboard = createLeaderboardUseCases(
    new InMemoryLeaderboardRepository([
      { id: 1, username: "AdminTest", email: "admin@admin.admin", totalScore: 999999999, coins: 999999999 },
      { id: 2, username: "Ada", email: "ada@example.com", totalScore: 20, coins: 4 },
      { id: 3, username: "Bruno", email: "bruno@example.com", totalScore: 10, coins: 1 }
    ])
  );

  const result = await leaderboard.list({ limit: 10, guestScore: 10 });
  assert.deepEqual(result.items.map((item) => item.username), ["Ada", "Bruno"]);
  assert.equal(result.guestPosition, 3);
}

async function testShopUseCases() {
  const shopRepository = new InMemoryShopRepository();
  const shop = createShopUseCases(shopRepository);
  shopRepository.addUser({
    id: 7,
    username: "Shopper",
    email: "shopper@example.com",
    coins: 100,
    totalScore: 0,
    settings: { equippedItemId: "tree_green" },
    purchases: []
  });

  const bought = await shop.buy(7, "tree_moon");
  assert.equal(bought.user?.coins, 50);

  const duplicateBuy = await shop.buy(7, "tree_moon");
  assert.equal(duplicateBuy.user?.coins, 50);

  await assert.rejects(() => shop.buy(7, "missing_item"), /Item non trovato/);

  await assert.rejects(() => shop.buy(7, "tree_prism"), /Monete insufficienti/);

  const equipped = await shop.equip(7, "tree_moon");
  assert.equal((equipped.user?.settings as { equippedItemId?: string })?.equippedItemId, "tree_moon");

  await assert.rejects(() => shop.equip(7, "tree_prism"), /Prima devi acquistare/);

  await assert.rejects(() => shop.equip(7, "missing_item"), /Prima devi acquistare/);
}

async function testLobbyUseCases() {
  const lobbies = createLobbyUseCases(new InMemoryLobbyRepository(), 20);
  const created = await lobbies.create({ hostId: 1, difficulty: "Medio" }) as MemoryLobby;
  assert.equal(created.status, "WAITING");
  assert.match(created.code, /^TD-/);

  const joined = await lobbies.join({ code: created.code, userId: 2 }) as MemoryLobby;
  assert.equal(joined.guestId, 2);
  assert.equal(joined.status, "IN_PROGRESS");

  await assert.rejects(() => lobbies.join({ code: created.code, userId: 3 }), /Lobby non disponibile/);

  const hostResult = await lobbies.finish({ code: created.code, userId: 1, score: 42 }) as MemoryLobby;
  assert.equal(hostResult.status, "IN_PROGRESS");
  assert.equal(hostResult.hostScore, 42);

  const finalResult = await lobbies.finish({ code: created.code, userId: 2, score: 42 }) as MemoryLobby;
  assert.equal(finalResult.status, "FINISHED");
  assert.equal(finalResult.winnerId, null);

  const second = await lobbies.create({ hostId: 4, difficulty: "Difficile" }) as MemoryLobby;
  await lobbies.join({ code: second.code, userId: 5 });
  const secondHostResult = await lobbies.finish({ code: second.code, userId: 4, score: 12 }) as MemoryLobby;
  assert.equal(secondHostResult.hostScore, 12);

  const secondFinalResult = await lobbies.finish({ code: second.code, userId: 5, score: 40 }) as MemoryLobby;
  assert.equal(secondFinalResult.status, "FINISHED");
  assert.equal(secondFinalResult.winnerId, 5);

  const immutableFinalResult = await lobbies.finish({ code: second.code, userId: 4, score: 99 }) as MemoryLobby;
  assert.equal(immutableFinalResult.hostScore, 12);
  assert.equal(immutableFinalResult.winnerId, 5);
}

async function testGeolocationUseCases() {
  const provider: GeolocationProvider = {
    reverse: async () => ({
      countryCode: "IT",
      region: "Campania",
      capitalCity: "Napoli",
      city: "Napoli"
    })
  };

  const geolocation = createGeolocationUseCases(provider);
  const result = await geolocation.reverse({ latitude: 40.8518, longitude: 14.2681, language: "it" });
  assert.equal(result.region, "Campania");
  assert.equal(result.capitalCity, "Napoli");

  const failingGeolocation = createGeolocationUseCases({
    reverse: async () => {
      throw new Error("offline");
    }
  });

  await assert.rejects(
    () => failingGeolocation.reverse({ latitude: 0, longitude: 0, language: "it" }),
    /Reverse geocoding non disponibile/
  );
}

async function main() {
  await testAuthUseCases();
  await testGameUseCases();
  await testLeaderboardUseCases();
  await testShopUseCases();
  await testLobbyUseCases();
  await testGeolocationUseCases();
  console.log("Use case smoke tests OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
