import type { PrismaClient } from "@prisma/client";
import type { CatalogRepository } from "../../../domain/repositories/CatalogRepository";

const ruleSetInclude = { wasteTypes: { include: { wastes: true } } } as const;

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAreas() {
    return this.prisma.ruleSet.findMany({
      where: { isDefault: false },
      orderBy: [{ region: "asc" }, { capitalCity: "asc" }],
      select: { region: true, capitalCity: true }
    });
  }

  findDefaultRuleSet() {
    return this.prisma.ruleSet.findFirst({
      where: { isDefault: true },
      include: ruleSetInclude
    });
  }

  findSpecificRuleSet(region: string, capitalCity: string) {
    return this.prisma.ruleSet.findFirst({
      where: {
        region: { equals: region, mode: "insensitive" },
        capitalCity: { equals: capitalCity, mode: "insensitive" }
      },
      include: ruleSetInclude
    });
  }

  findByRegion(region: string) {
    return this.prisma.ruleSet.findFirst({
      where: {
        region: { equals: region, mode: "insensitive" },
        isDefault: false
      },
      include: ruleSetInclude
    });
  }

  findByCapital(capitalCity: string) {
    return this.prisma.ruleSet.findFirst({
      where: {
        capitalCity: { equals: capitalCity, mode: "insensitive" },
        isDefault: false
      },
      include: ruleSetInclude
    });
  }
}
