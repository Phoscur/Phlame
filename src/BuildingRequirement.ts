import { ResourceIdentifier } from "./resources/Resource";
import ResourceCollection from "./resources/ResourceCollection";
import Empire from "./Empire";

export type RequirementType = string;
/**
 * BuildingRequirement to up- or downgrade something
 * also stores the costs for the action
 */
export default class BuildingRequirement<ResourceTypes extends ResourceIdentifier> {
  static DEFAULT_DOWNGRADECOST_DIVISOR = 2;

  type: RequirementType;

  costs: ResourceCollection<ResourceTypes>;

  empire: Empire<ResourceTypes>;

  constructor(type: RequirementType, costs: ResourceCollection<ResourceTypes>, empire: Empire<ResourceTypes>) {
    this.type = type;
    this.costs = costs;
    this.empire = empire;
  }

  matches(type: RequirementType) {
    return this.type === type;
  }

  get satisfied() {
    return this.empire.resources.isFetchable(this.upgradeCost);
  }

  get satisfiedForDowngrade() {
    return this.empire.resources.isFetchable(this.downgradeCost);
  }

  get upgradeCost() {
    return this.costs;
  }

  get downgradeCost() {
    return this.costs.times(1 / BuildingRequirement.DEFAULT_DOWNGRADECOST_DIVISOR);
  }

  toString() {
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
