import type { JsonValue } from "../entities/types";

export class DomainError extends Error {
  status: number;
  details?: JsonValue;

  constructor(status: number, message: string, details?: JsonValue) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
