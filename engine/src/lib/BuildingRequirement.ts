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
export default class BuildingRequirement<
  RequirementType extends RequirementTypes,
  ResourceTypes extends ResourceIdentifier,
> {
  static DOWNGRADECOST_DIVISOR = 2;

  readonly type: RequirementType;

  readonly costs: ResourceCollection<ResourceTypes>;

  readonly costFactor: number;

  readonly dependencies: Dependency<RequirementType>[];

  constructor(
    type: RequirementType,
    costs: ResourceCollection<ResourceTypes>,
    factor: number,
    dependencies: Dependency<RequirementType>[],
  ) {
    this.type = type;
    this.costs = costs;
    this.costFactor = factor;
    this.dependencies = dependencies;
  }

  matches(type: RequirementType): boolean {
    return this.type === type;
  }

  isSatisfied(level: number, factoryResources: EnergyCalculation<ResourceTypes>): boolean {
    return factoryResources.hasAvailable(this.getUpgradeCost(level));
  }

  isSatisfiedForDowngrade(
    level: number,
    factoryResources: EnergyCalculation<ResourceTypes>,
  ): boolean {
    return factoryResources.hasAvailable(this.getDowngradeCost(level));
  }

  getUpgradeCost(level: number): ResourceCollection<ResourceTypes> {
    return this.costs.times(this.costFactor ** level);
  }

  getDowngradeCost(level: number): ResourceCollection<ResourceTypes> {
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
