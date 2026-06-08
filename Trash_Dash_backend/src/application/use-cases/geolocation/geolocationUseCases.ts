import { DomainError } from "../../../domain/errors/DomainError";
import type { GeolocationProvider } from "../../ports/GeolocationProvider";

export function createGeolocationUseCases(provider: GeolocationProvider) {
  return {
    async reverse(input: { latitude: number; longitude: number; language: "it" | "en" }) {
      try {
        return await provider.reverse(input);
      } catch {
        throw new DomainError(502, "Reverse geocoding non disponibile");
      }
    }
  };
}
