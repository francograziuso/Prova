import type { ReverseGeocodeResult } from "../../domain/entities/types";

export interface GeolocationProvider {
  reverse(input: { latitude: number; longitude: number; language: "it" | "en" }): Promise<ReverseGeocodeResult>;
}
