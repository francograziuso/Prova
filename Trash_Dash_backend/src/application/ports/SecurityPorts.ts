import type { AuthenticatedUser } from "../../domain/entities/types";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  sign(payload: AuthenticatedUser): string;
}
