import { DomainError } from "../../../domain/errors/DomainError";
import type { UserRepository } from "../../../domain/repositories/UserRepository";
import type { PasswordHasher, TokenService } from "../../ports/SecurityPorts";

type Dependencies = {
  users: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
};

export function createAuthUseCases({ users, passwordHasher, tokenService }: Dependencies) {
  return {
    async register(input: { username: string; email: string; password: string }) {
      const email = input.email.toLowerCase();
      const existing = await users.findByEmailOrUsername(email, input.username);
      if (existing) throw new DomainError(409, "Email o username già registrati");

      const passwordHash = await passwordHasher.hash(input.password);
      const user = await users.createRegisteredUser({
        username: input.username,
        email,
        passwordHash
      });

      const token = tokenService.sign({ id: user.id, email: user.email });
      return { token, user };
    },

    async login(input: { email: string; password: string }) {
      const user = await users.findByEmailWithPassword(input.email.toLowerCase());
      if (!user || !(await passwordHasher.verify(input.password, user.passwordHash))) {
        throw new DomainError(401, "Credenziali non valide");
      }

      const { passwordHash: _passwordHash, ...publicUser } = user;
      const token = tokenService.sign({ id: publicUser.id, email: publicUser.email });
      return { token, user: publicUser };
    }
  };
}
