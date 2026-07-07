import type { ResourceIdentifier } from './resources/Resource';
import type { ProsumerIdentifier } from './resources/Prosumer';
import type { PhelopmentRequirement, PhelopmentRequirementJSON } from './PhelopmentRequirement';
import { Phormula, type PhormulaJSON } from './Phormula';
import { phingerprint } from './Phingerprint';

export enum BaseResources {
  Null = 'null', // no plural
  Energy = 'energy', // no plural, very special
}

export type PhelopmentIdentifier = ProsumerIdentifier;

export type ProsumptionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: Phormula;
};

export type ProsumptionLookup<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> = {
  [Type in PhelopmentType]?: ProsumptionEntries<ResourceType>;
};

export type RequirementLookup<
  ResourceType extends ResourceIdentifier,
  PhelopmentType extends PhelopmentIdentifier,
> = {
  [Type in PhelopmentType]?: PhelopmentRequirement<ResourceType, PhelopmentType>;
};

export interface PhormulaeJSON {
  resourceTypes: ResourceIdentifier[];
  energyTypes: ResourceIdentifier[];
  buildTimeDivisor: number;
  downgradeCostDivisor: number;
  rebalancingExponent: number;
  requirements: Partial<Record<PhelopmentIdentifier, PhelopmentRequirementJSON>>;
  prosumptions: Partial<Record<PhelopmentIdentifier, Partial<Record<ResourceIdentifier, PhormulaJSON>>>>;
}

/**
 * Phormulae - the game rules as data (ADR 0014/0015); a universe's formula collection
 * (plural of Phormula, in the Ph tradition of Phlame).
 * Carries the type registries, tuning constants, phelopment requirements and prosumption
 * Phormulae which historically lived as mutable statics and per-Phelopment lookups.
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
    readonly requirements: RequirementLookup<ResourceIdentifier, PhelopmentIdentifier> = {},
    readonly prosumptions: ProsumptionLookup<ResourceIdentifier, PhelopmentIdentifier> = {},
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
    requirements: RequirementLookup<ResourceIdentifier, PhelopmentIdentifier>,
    prosumptions: ProsumptionLookup<ResourceIdentifier, PhelopmentIdentifier>,
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

  withRequirements<R extends ResourceIdentifier, B extends PhelopmentIdentifier>(
    requirements: RequirementLookup<R, B>,
  ): Phormulae {
    return this.new(this.resourceTypes, this.energyTypes, requirements, this.prosumptions);
  }

  withProsumptions<R extends ResourceIdentifier, B extends PhelopmentIdentifier>(
    prosumptions: ProsumptionLookup<R, B>,
  ): Phormulae {
    return this.new(this.resourceTypes, this.energyTypes, this.requirements, prosumptions);
  }

  /**
   * @throws on unknown phelopment types - rules must be complete
   */
  requirementFor(type: PhelopmentIdentifier): PhelopmentRequirement<ResourceIdentifier, PhelopmentIdentifier> {
    const requirement = this.requirements[type];
    if (!requirement) {
      throw new Error(`Unknown phelopment requirement, PhelopmentType: ${type}`);
    }
    return requirement;
  }

  /**
   * Prosumption Phormulae of a phelopment type (empty for unknown types - not every
   * phelopment produces or consumes)
   */
  prosumptionFor(type: PhelopmentIdentifier): ProsumptionEntries<ResourceIdentifier> {
    return this.prosumptions[type] ?? {};
  }

  /**
   * The universe's Phingerprint (ADR 0011): the content hash of these rules.
   * A universe is identified by it; changing any rule changes the Phingerprint.
   * The type registries are hashed as *sets* (sorted) - listing the same types in a
   * different order is the same universe. Cost arrays inside requirements stay ordered.
   */
  get phingerprint(): string {
    const json = this.toJSON();
    return phingerprint({
      ...json,
      resourceTypes: [...json.resourceTypes].sort(),
      energyTypes: [...json.energyTypes].sort(),
    });
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
