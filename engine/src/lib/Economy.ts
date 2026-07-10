import {
  Energy,
  EnergyCalculation,
  Prosumer,
  Resource,
  ResourceCollection,
  ResourceProcess,
  ResourceProcessCollection,
  Stock,
  type ResourceIdentifier,
} from './resources';
import { Phelopment, type PhelopmentIdentifier, type PhelopmentJSON } from './Phelopment';
import { Phormulae } from './Phormulae';
import { ProsumerCollection } from './resources/ProsumerCollection';
import type { StockJSON } from './resources/Stock';
import type { TimeUnit } from './resources/ResourceProcess';

export interface EconomyJSON<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  phelopments: PhelopmentJSON<PhelopmentType>[];
  stock: StockJSON<ResourceType>;
  name: string;
};

/**
 * Economy is the sum of production and consumption of resources and energy
 * for a set of phelopment prosumers
 * It interprets the Phormulae (ADR 0015): phelopments are pure state, the economy
 * computes their prosumption, costs and build times from the rules.
 */
export class Economy<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> {
  readonly resources: EnergyCalculation<ResourceType>;

  constructor(
    // TODO add/replace: readonly seed - binary or ID like/derived string
    readonly name: string, // TODO? remove unused - or use this as a type? - rather leave it to an actual entity
    resources: Stock<ResourceType>,
    readonly phelopments: Phelopment<ResourceType, PhelopmentType>[] = [],
    // rules are explicit now - no Phormulae.current fallback (ADR 0014, injection done)
    readonly phormulae: Phormulae = new Phormulae(),
  ) {
    this.resources = this.getResourceCalculation(resources, phelopments);
  }

  get stock(): Stock<ResourceType> {
    return this.resources.stock;
  }

  /**
   * Interpret the prosumption Phormulae of a phelopment at its level and speed
   */
  prosumes(
    phelopment: Phelopment<ResourceType, PhelopmentType>,
    stock: Stock<ResourceType> = this.stock,
  ): Prosumer<ResourceType> {
    const prosumption = this.phormulae.prosumptionFor(phelopment.type);
    const energyTypes = this.phormulae.energyTypes;
    const processes = Object.keys(prosumption).map((type) => {
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      const phormula = prosumption[type as ResourceType]!; // keys are never undefined
      const rate = phormula.at(phelopment.level);
      // energy isn't stocked (balanced, not stored) - build its placeholder from the
      // rules; only the rules-aware Economy knows which types are energy (ADR 0014)
      const stocked = energyTypes.includes(type)
        ? ((stock.getByType(type as ResourceType) as Energy<ResourceType> | undefined) ??
          new Energy(type as ResourceType, 0))
        : stock.has(type as ResourceType);
      // limit production for an optionally maximal stock
      // also for energy a zero resource resource can be created implicitly
      // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
      const max = (stock.max.getByType(type as ResourceType) as Resource<ResourceType>) ?? stocked;
      return new ResourceProcess<ResourceType>(rate > 0 ? max : stocked, rate);
    });

    return new Prosumer<ResourceType>(
      phelopment.type,
      ResourceProcessCollection.fromArray<ResourceType>(processes),
      phelopment.speed,
    );
  }

  upgradeCost(phelopment: Phelopment<ResourceType, PhelopmentType>): ResourceCollection<ResourceType> {
    return this.phormulae
      .requirementFor(phelopment.type)
      .getUpgradeCost(phelopment.level + 1) as ResourceCollection<ResourceType>;
  }

  downgradeCost(phelopment: Phelopment<ResourceType, PhelopmentType>): ResourceCollection<ResourceType> {
    return this.phormulae
      .requirementFor(phelopment.type)
      .getDowngradeCost(phelopment.level + 1, this.phormulae.downgradeCostDivisor) as ResourceCollection<ResourceType>;
  }

  upgradeTime(phelopment: Phelopment<ResourceType, PhelopmentType>): TimeUnit {
    return this.buildTime(this.upgradeCost(phelopment));
  }

  downgradeTime(phelopment: Phelopment<ResourceType, PhelopmentType>): TimeUnit {
    return this.buildTime(this.downgradeCost(phelopment));
  }

  protected buildTime(costs: ResourceCollection<ResourceType>): TimeUnit {
    return Math.max(
      this.phormulae.minBuildTime,
      Math.floor(
        costs.map((resource) => resource.amount).reduce((sum, amount) => sum + amount, 0) /
          this.phormulae.buildTimeDivisor,
      )
    );
  }

  fetch(cost: ResourceCollection<ResourceType>): Economy<ResourceType, PhelopmentType> {
    return this.new(this.resources.stock.fetch(cost), this.phelopments);
  }

  ticksUntilAffordable(cost: ResourceCollection<ResourceType>): number {
    if (this.resources.stock.isFetchable(cost)) {
      return 0;
    }
    const missing = this.resources.stock.getUnfetchable(cost);
    let maxTicks = 0;
    for (const res of missing.asArray) {
      const tableEntry = this.resources.productionTable.find(t => t[0] === res.type);
      if (!tableEntry) return Infinity;
      const rate = tableEntry[1];
      if (rate <= 0) {
        return Infinity;
      }
      const ticks = Math.ceil(res.amount / rate);
      if (ticks > maxTicks) {
        maxTicks = ticks;
      }
    }
    return maxTicks;
  }

  getResourceCalculation(
    resources: Stock<ResourceType>,
    phelopments: Phelopment<ResourceType, PhelopmentType>[],
  ): EnergyCalculation<ResourceType> {
    const prosumers = new ProsumerCollection(
      phelopments.map((phelopment) => {
        return this.prosumes(phelopment, resources);
      }),
    );
    return EnergyCalculation.newStock<ResourceType>(
      resources,
      prosumers,
      this.phormulae.rebalancingExponent,
    );
  }

  protected new(
    resources: Stock<ResourceType>,
    phelopments: Phelopment<ResourceType, PhelopmentType>[],
  ): Economy<ResourceType, PhelopmentType> {
    return new Economy(this.name, resources, phelopments, this.phormulae);
  }

  /**
   * Adjust consumption of exhausted resources:
   * Halt phelopments
   */
  recalculationStrategy(
    stock: Stock<ResourceType>,
    factor: number,
    phelopments: Phelopment<ResourceType, PhelopmentType>[],
  ): Phelopment<ResourceType, PhelopmentType>[] {
    const prosumers = new ProsumerCollection<ResourceType>(
      phelopments.map((b) => this.prosumes(b, stock)),
    );
    const prosumption = factor < 1 ? prosumers.rebalancedResources(factor) : prosumers.reduced;
    const nextTickWithdrawal = prosumption.getNegativeResourcesFor(1);
    // if (stock.isFetchable(nextTickWithdrawal)) {
    //   return phelopments; // TODO how to cover this with a test?
    // }
    const missing = stock.getUnfetchable(nextTickWithdrawal);
    return phelopments.map((phelopment) => {
      const halt = missing.asArray.some((resource) =>
        this.prosumes(phelopment, stock).consumes(resource),
      );
      if (halt) {
        // console.warn(`Halting ${phelopment}`);
        // halt phelopment production if its prosumption includes consumption which can't be fulfilled
        return phelopment.disabled;
      }
      return phelopment;
    });
  }

  upgrade(phelopmentType: PhelopmentIdentifier): Economy<ResourceType, PhelopmentType> {
    return this.new(
      this.resources.stock,
      this.phelopments.map((phelopment: Phelopment<ResourceType, PhelopmentType>) => {
        if (phelopment.type === phelopmentType) {
          return phelopment.upgraded;
        }
        return phelopment;
      }),
    );
  }

  downgrade(phelopmentType: PhelopmentIdentifier): Economy<ResourceType, PhelopmentType> {
    return this.new(
      this.resources.stock,
      this.phelopments.map((phelopment: Phelopment<ResourceType, PhelopmentType>) => {
        if (phelopment.type === phelopmentType) {
          return phelopment.downgraded;
        }
        return phelopment;
      }),
    );
  }

  tick(cycles = 1): Economy<ResourceType, PhelopmentType> {
    let { resources, phelopments } = this;
    while (resources.validFor < cycles) {
      const advanceCycles = resources.validFor;
      cycles -= advanceCycles;
      resources = resources.calculate(advanceCycles);
      phelopments = this.recalculationStrategy(resources.stock, resources.balanceFactor, phelopments);
      resources = this.getResourceCalculation(resources.stock, phelopments);
      if (!resources.validFor) {
        throw new Error('Invalid resource (re)calculation');
      }
    }

    resources = resources.calculate(cycles);
    return this.new(resources.stock, phelopments);
  }

  toString(): string {
    return `${this.name} (${this.resources.toString()}) [${this.phelopments.join(', ')}]`;
  }

  toJSON(): EconomyJSON<ResourceType, PhelopmentType> {
    return {
      name: this.name,
      stock: this.resources.stock.toJSON(),
      phelopments: this.phelopments.map((b) => b.toJSON()),
    };
  }
}
