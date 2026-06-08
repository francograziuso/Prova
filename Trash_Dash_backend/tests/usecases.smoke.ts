import assert from "node:assert/strict";
import { createAuthUseCases } from "../src/application/use-cases/auth/authUseCases";
import { calculateCoinsEarned, createGameUseCases } from "../src/application/use-cases/games/gameUseCases";
import { createLeaderboardUseCases } from "../src/application/use-cases/leaderboard/leaderboardUseCases";
import type { PasswordHasher, TokenService } from "../src/application/ports/SecurityPorts";
import type { GameSubmitInput, PublicLeaderboardUser, SettingsInput, UserProfile } from "../src/domain/entities/types";
import type { GameRepository } from "../src/domain/repositories/GameRepository";
import type { LeaderboardRepository } from "../src/domain/repositories/LeaderboardRepository";
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

class InMemoryGameRepository implements GameRepository {
  public created: unknown[] = [];

  async create(input: GameSubmitInput & { coinsEarned: number }) {
    this.created.push(input);
    return { id: this.created.length, ...input };
  }

  async findRecentByUserId(_userId: number, _limit: number) {
    return this.created;
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

async function main() {
  await testAuthUseCases();
  await testGameUseCases();
  await testLeaderboardUseCases();
  console.log("Use case smoke tests OK");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
