import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../../utils/jwt";
import { HttpError } from "../../../utils/http";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.userId, email: payload.email };
  } catch {
    // Optional auth: token non valido ignorato per endpoint pubblici.
  }

  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Autenticazione richiesta"));
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.userId, email: payload.email };
    return next();
  } catch {
    return next(new HttpError(401, "Token non valido o scaduto"));
  }
}
