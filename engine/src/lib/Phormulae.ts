import type { ResourceIdentifier } from './resources/Resource';
import type { ProsumerIdentifier } from './resources/Prosumer';
import type { BuildingRequirement, BuildingRequirementJSON } from './BuildingRequirement';
import { Phormula, type PhormulaJSON } from './Phormula';

export enum BaseResources {
  Null = 'null', // no plural
  Energy = 'energy', // no plural, very special
}

export type BuildingIdentifier = ProsumerIdentifier;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: Phormula;
};

export type ProsumptionLookup<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> = {
  [Type in BuildingType]?: ProsumptionEntries<ResourceType>;
};

export type RequirementLookup<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> = {
  [Type in BuildingType]?: BuildingRequirement<ResourceType, BuildingType>;
};

export interface PhormulaeJSON {
  resourceTypes: ResourceIdentifier[];
  energyTypes: ResourceIdentifier[];
  buildTimeDivisor: number;
  downgradeCostDivisor: number;
  rebalancingExponent: number;
  requirements: Partial<Record<BuildingIdentifier, BuildingRequirementJSON>>;
  prosumptions: Partial<Record<BuildingIdentifier, Partial<Record<ResourceIdentifier, PhormulaJSON>>>>;
}

/**
 * Phormulae - the game rules as data (ADR 0014/0015); a universe's formula collection
 * (plural of Phormula, in the Ph tradition of Phlame).
 * Carries the type registries, tuning constants, building requirements and prosumption
 * Phormulae which historically lived as mutable statics and per-Building lookups.
 * Immutable like every value object: registration returns a new instance.
 * A universe is identified by the hash of the canonical `toJSON()` form (ADR 0011).
 *
 * Deliberately data-only with no runtime imports from the engine's compute layers:
 * the rule document must not import its interpreter (Economy) - see ADR 0015.
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
    readonly requirements: RequirementLookup<ResourceIdentifier, BuildingIdentifier> = {},
    readonly prosumptions: ProsumptionLookup<ResourceIdentifier, BuildingIdentifier> = {},
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
    requirements: RequirementLookup<ResourceIdentifier, BuildingIdentifier>,
    prosumptions: ProsumptionLookup<ResourceIdentifier, BuildingIdentifier>,
  ): Phormulae {
    return new Phormulae(
      resourceTypes,
      energyTypes,
      this.buildTimeDivisor,
      this.downgradeCostDivisor,
      this.rebalancingExponent,
      requirements,
      prosumptions,
    );
  }

  withResourceTypes(...types: ResourceIdentifier[]): Phormulae {
    return this.new(
      [...this.resourceTypes, ...types],
      this.energyTypes,
      this.requirements,
      this.prosumptions,
    );
  }

  withEnergyTypes(...types: ResourceIdentifier[]): Phormulae {
    return this.new(
      this.resourceTypes,
      [...this.energyTypes, ...types],
      this.requirements,
      this.prosumptions,
    );
  }

  withRequirements<R extends ResourceIdentifier, B extends BuildingIdentifier>(
    requirements: RequirementLookup<R, B>,
  ): Phormulae {
    return this.new(this.resourceTypes, this.energyTypes, requirements, this.prosumptions);
  }

  withProsumptions<R extends ResourceIdentifier, B extends BuildingIdentifier>(
    prosumptions: ProsumptionLookup<R, B>,
  ): Phormulae {
    return this.new(this.resourceTypes, this.energyTypes, this.requirements, prosumptions);
  }

  /**
   * @throws on unknown building types - rules must be complete
   */
  requirementFor(type: BuildingIdentifier): BuildingRequirement<ResourceIdentifier, BuildingIdentifier> {
    const requirement = this.requirements[type];
    if (!requirement) {
      throw new Error(`Unknown building requirement, BuildingType: ${type}`);
    }
    return requirement;
  }

  /**
   * Prosumption Phormulae of a building type (empty for unknown types - not every
   * building produces or consumes)
   */
  prosumptionFor(type: BuildingIdentifier): ProsumptionEntries<ResourceIdentifier> {
    return this.prosumptions[type] ?? {};
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
      requirements: Object.fromEntries(
        Object.entries(this.requirements).map(([type, requirement]) => [
          type,
          requirement?.toJSON(),
        ]),
      ),
      prosumptions: Object.fromEntries(
        Object.entries(this.prosumptions).map(([type, entries]) => [
          type,
          Object.fromEntries(
            Object.entries(entries ?? {}).map(([resource, phormula]) => [
              resource,
              (phormula as Phormula).toJSON(),
            ]),
          ),
        ]),
      ),
    };
  }

  /**
   * The process-global phormulae backing the deprecated static shims
   * (`Resource.types`, `Energy.types`, ...).
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
