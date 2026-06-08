import type { SettingsInput } from "../../../domain/entities/types";
import { DomainError } from "../../../domain/errors/DomainError";
import type { UserRepository } from "../../../domain/repositories/UserRepository";

function normalizeLanguage(value?: "IT" | "EN" | "Italiano" | "English") {
  if (!value) return undefined;
  if (value === "English") return "EN";
  if (value === "Italiano") return "IT";
  return value;
}

export function createUserUseCases(users: UserRepository) {
  return {
    async getProfile(userId: number) {
      const user = await users.findProfileById(userId);
      if (!user) throw new DomainError(404, "Utente non trovato");
      return { user };
    },

    async updateSettings(userId: number, input: Omit<SettingsInput, "language"> & { language?: "IT" | "EN" | "Italiano" | "English" }) {
      const language = normalizeLanguage(input.language);
      const settings = await users.updateSettings(userId, { ...input, language });
      return { settings };
    }
  };
}
