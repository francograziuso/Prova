import type { Difficulty } from "../entities/types";

export type RuleSetWithWastes = {
  id: number;
  region: string;
  capitalCity: string;
  isDefault: boolean;
  wasteTypes: Array<{
    id: number;
    code: string;
    label: string;
    color: string;
    textColor: string;
    localColor: string | null;
    note: string | null;
    sourceUrl: string | null;
    wastes: Array<{
      id: number;
      name: string;
      icon: string;
      description: string;
      difficulty: Difficulty;
    }>;
  }>;
};

export interface CatalogRepository {
  findAreas(): Promise<Array<{ region: string; capitalCity: string }>>;
  findDefaultRuleSet(): Promise<RuleSetWithWastes | null>;
  findSpecificRuleSet(region: string, capitalCity: string): Promise<RuleSetWithWastes | null>;
  findByRegion(region: string): Promise<RuleSetWithWastes | null>;
  findByCapital(capitalCity: string): Promise<RuleSetWithWastes | null>;
}
