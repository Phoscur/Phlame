import type { ResourceIdentifier, ResourceJSON } from './resources/Resource';
import type { EnergyCalculation, ResourceCollection } from './resources';

export type RequirementTypes = number | string;
export interface Dependency<RequirementType extends RequirementTypes> {
  type: RequirementType;
  level: number;
}

export interface PhelopmentRequirementJSON {
  type: RequirementTypes;
  costs: ResourceJSON<ResourceIdentifier>[];
  costFactor: number;
  dependencies: Dependency<RequirementTypes>[];
}

/**
 * PhelopmentRequirement to up- or downgrade something
 * also stores the costs for the action
 * Pure rule data living inside the Phormulae (ADR 0015) - hence serializable
 */
export class PhelopmentRequirement<
  ResourceType extends ResourceIdentifier,
  RequirementType extends RequirementTypes,
> {
  constructor(
    readonly type: RequirementType,
    readonly costs: ResourceCollection<ResourceType>,
    readonly costFactor: number,
    readonly dependencies: Dependency<RequirementType>[],
  ) {}

  matches(type: RequirementType): boolean {
    return this.type === type;
  }

  isSatisfied(level: number, factoryResources: EnergyCalculation<ResourceType>): boolean {
    // TODO check dependencies
    return factoryResources.hasAvailable(this.getUpgradeCost(level));
  }

  isSatisfiedForDowngrade(
    level: number,
    factoryResources: EnergyCalculation<ResourceType>,
  ): boolean {
    return factoryResources.hasAvailable(this.getDowngradeCost(level));
  }

  getUpgradeCost(level: number): ResourceCollection<ResourceType> {
    return this.costs.times(this.costFactor ** level);
  }

  /**
   * @param divisor from the Phormulae (`downgradeCostDivisor`); defaults to the base rules
   */
  getDowngradeCost(level: number, divisor = 2): ResourceCollection<ResourceType> {
    return this.costs.times(1 / divisor).times(this.costFactor ** level);
  }

  toString(): string {
    return `PhelopmentRequirement(${this.type})`;
  }

  toJSON(): PhelopmentRequirementJSON {
    const { type, costFactor, dependencies } = this;
    return {
      type,
      costs: this.costs.toJSON(),
      costFactor,
      dependencies,
    };
  }
}
