import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../application/ports/SecurityPorts";

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  verify(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
