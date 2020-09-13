import type { ResourceIdentifier } from "./Resource";
import type { TimeUnit } from "./ResourceProcess";
import Energy from "./Energy";
import Prosumer from "./Prosumer";
import ResourceCalculation from "./ResourceCalculation";
import ResourceCollection from "./ResourceCollection";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Stock from "./Stock";

export default class EnergyCalculation<Types extends ResourceIdentifier> {
  readonly resources: ResourceCalculation<Types>;

  readonly prosumers: Prosumer<Types>[];

  readonly limits: Energy<Types>[];

  constructor(resources: ResourceCalculation<Types>, prosumers: Prosumer<Types>[], limits: Energy<Types>[]) {
    this.resources = resources;
    this.prosumers = prosumers;
    this.limits = limits;
  }

  static newStock<ResourceTypes extends ResourceIdentifier>(
    stock: Stock<ResourceTypes>,
    prosumers: Prosumer<ResourceTypes>[],
  ) {
    return new EnergyCalculation<ResourceTypes>(
      new ResourceCalculation(stock, ResourceProcessCollection.fromArray([])),
      prosumers,
      [],
    );
  }

  get validFor(): TimeUnit {
    return this.resources.validFor;
  }

  hasAvailable(resources: ResourceCollection<Types>) {
    // TODO check for energy seperately?
    return this.resources.stock.isFetchable(resources);
  }

  calculate(timeUnits: TimeUnit) {
    // TODO Still need to loop around at some point and adjust if !validFor
    const resources = this.resources.calculate(timeUnits);
    return new EnergyCalculation(resources, this.prosumers, this.limits);
  }

  get prettyLimits() {
    return this.limits.map((limit) => {
      return limit.prettyAmount;
    });
  }

  get prettyProsumers() {
    return this.prosumers.map((prosumer) => {
      return prosumer.toString();
    });
  }

  toString() {
    // return `Processing energy&resources: ${this.prettyLimits.join(", ")} - ${this.resources.entries.join(", ")}`;
    return `${this.resources.stock}`;
  }

  /**
   * Should return entries like this:
   * - 10energy Prosumer(A, 1, 1) 89/112 or even -58
   * - 3tumbles(0, 5): +2
   * - 3salties(0, 3): -1
   */
  get productionTable(): string[] {
    return this.limits.map((limit) => {
      return limit.prettyAmount;
    }).concat(...this.prettyProsumers, ...this.resources.entries);
  }
}
