
import { ResourceIdentifier } from "./Resource";
import { TimeUnit } from "./ResourceProcess";
import Energy from "./Energy";
import ResourceCalculation from "./ResourceCalculation";
import Consumer from "./Consumer";

export default class EnergyCalculation<Types extends ResourceIdentifier> {
  readonly resources: ResourceCalculation<Types>;

  readonly consumers: Consumer[];

  readonly limits: Energy<Types>[];

  constructor(resources: ResourceCalculation<Types>, consumers: Consumer[], limits: Energy<Types>[]) {
    this.resources = resources;
    this.consumers = consumers;
    this.limits = limits;
  }

  get validFor(): TimeUnit {
    return this.resources.validFor;
  }

  calculate(timeUnits: TimeUnit) {
    const resources = this.resources.calculate(timeUnits);
    return new EnergyCalculation(resources, this.consumers, this.limits);
  }

  get prettyLimits() {
    return this.limits.map((limit) => {
      return limit.prettyAmount;
    });
  }

  toString() {
    return `Processing energy&resources: ${this.prettyLimits.join(", ")} - ${this.resources.entries.join(", ")}`;
  }
}
