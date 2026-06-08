import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError } from "../../../domain/errors/DomainError";
import { HttpError } from "../../../utils/http";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Endpoint non trovato: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Dati non validi", details: err.flatten() });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  if (err instanceof DomainError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  console.error(err);
  return res.status(500).json({ message: "Errore interno del server" });
}
