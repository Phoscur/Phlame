import type { ResourceIdentifier } from './resources/Resource';
import { EnergyCalculation, ResourceCollection } from './resources';

export type RequirementTypes = number | string;
export interface Dependency<RequirementType extends RequirementTypes> {
  type: RequirementType;
  level: number;
}
/**
 * BuildingRequirement to up- or downgrade something
 * also stores the costs for the action
 */
export class BuildingRequirement<
  ResourceType extends ResourceIdentifier,
  RequirementType extends RequirementTypes,
> {
  static DOWNGRADECOST_DIVISOR = 2;

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

  getDowngradeCost(level: number): ResourceCollection<ResourceType> {
    return this.costs
      .times(1 / BuildingRequirement.DOWNGRADECOST_DIVISOR)
      .times(this.costFactor ** level);
  }

  toString(): string {
    return `BuildingRequirement(${this.type})`;
  }
}

/**
 * Decoraterfunction to add a multiplicator which is a base raised to the power of the buildings level
 * @param {Function} costsFunction returning a ResourceCollection
 * @param {Number} base
 * @return {Function} new function to calculate costs of a building (accepts the building as parameter)
 * /
BuildingRequirement.curryCostsWithMultiplicatorBaseToTheBuildinglevel = function(costsFunction, base) {
    return function(building) {
        return costsFunction(building).times(Math.pow(base, building.getLevel()));
    };
}; */
