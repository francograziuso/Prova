import jwt, { type SignOptions } from "jsonwebtoken";
import type { TokenService } from "../../application/ports/SecurityPorts";
import type { AuthenticatedUser } from "../../domain/entities/types";
import { env } from "../../config/env";

export class JwtTokenService implements TokenService {
  sign(payload: AuthenticatedUser) {
    return jwt.sign({ userId: payload.id, email: payload.email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
    });
  }
}
