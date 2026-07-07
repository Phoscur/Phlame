import type { ResourceIdentifier } from './resources/Resource';

export enum BaseResources {
  Null = 'null', // no plural
  Energy = 'energy', // no plural, very special
}

export interface PhormulaeJSON {
  resourceTypes: ResourceIdentifier[];
  energyTypes: ResourceIdentifier[];
  buildTimeDivisor: number;
  downgradeCostDivisor: number;
  rebalancingExponent: number;
}

/**
 * Phormulae - the game rules as data (ADR 0014); a universe's formula collection
 * (plural of Phormula, in the Ph tradition of Phlame).
 * Carries the type registries and tuning constants which historically lived as mutable
 * statics on Resource/Energy/Building/BuildingRequirement/EnergyCalculation.
 * Immutable like every value object: registration returns a new instance.
 * A universe is identified by the hash of the canonical `toJSON()` form (ADR 0011).
 */
export class Phormulae {
  readonly resourceTypes: ResourceIdentifier[];
  readonly energyTypes: ResourceIdentifier[];

  constructor(
    resourceTypes: ResourceIdentifier[] = [],
    energyTypes: ResourceIdentifier[] = [],
    readonly buildTimeDivisor = 2500 / 60,
    readonly downgradeCostDivisor = 2,
    readonly rebalancingExponent = 1.1,
  ) {
    // the Null type is an engine invariant (constructor fallback), not a balancing choice
    this.resourceTypes = resourceTypes.includes(BaseResources.Null)
      ? resourceTypes
      : [BaseResources.Null, ...resourceTypes];
    this.energyTypes = energyTypes.includes(BaseResources.Null)
      ? energyTypes
      : [BaseResources.Null, ...energyTypes];
  }

  protected new(
    resourceTypes: ResourceIdentifier[],
    energyTypes: ResourceIdentifier[],
  ): Phormulae {
    return new Phormulae(
      resourceTypes,
      energyTypes,
      this.buildTimeDivisor,
      this.downgradeCostDivisor,
      this.rebalancingExponent,
    );
  }

  withResourceTypes(...types: ResourceIdentifier[]): Phormulae {
    return this.new([...this.resourceTypes, ...types], this.energyTypes);
  }

  withEnergyTypes(...types: ResourceIdentifier[]): Phormulae {
    return this.new(this.resourceTypes, [...this.energyTypes, ...types]);
  }

  toString(): string {
    return `Phormulae[${this.resourceTypes.join(', ')}|${this.energyTypes.join(', ')}]`;
  }

  /**
   * Canonical serialization - the future universe rules hash (ADR 0011) hashes this
   */
  toJSON(): PhormulaeJSON {
    const { resourceTypes, energyTypes, buildTimeDivisor, downgradeCostDivisor, rebalancingExponent } = this;
    return {
      resourceTypes,
      energyTypes,
      buildTimeDivisor,
      downgradeCostDivisor,
      rebalancingExponent,
    };
  }

  /**
   * The process-global phormulae backing the deprecated static shims
   * (`Resource.types`, `Building.BUILD_TIME_DIVISOR`, ...).
   * The last global - it dies once a Phormulae is injected everywhere (ADR 0014).
   */
  static current = new Phormulae();

  /**
   * Swap the current phormulae, returning the previous one (restore it after tests!)
   */
  static use(phormulae: Phormulae): Phormulae {
    const previous = Phormulae.current;
    Phormulae.current = phormulae;
    return previous;
  }
}
