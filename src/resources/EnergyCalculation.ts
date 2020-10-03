import type { ResourceIdentifier } from "./Resource";
import type { TimeUnit } from "./ResourceProcess";
import Prosumer from "./Prosumer";
import ResourceCalculation from "./ResourceCalculation";
import ResourceCollection from "./ResourceCollection";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Stock from "./Stock";

export default class EnergyCalculation<Types extends ResourceIdentifier> {
  readonly resources: ResourceCalculation<Types>;

  readonly prosumers: Prosumer<Types>[];

  constructor(resources: ResourceCalculation<Types>, prosumers: Prosumer<Types>[]) {
    this.resources = resources;
    this.prosumers = prosumers;
  }

  static newStock<ResourceTypes extends ResourceIdentifier>(
    stock: Stock<ResourceTypes>,
    prosumers: Prosumer<ResourceTypes>[],
  ) {
    const resources = prosumers.map((prosumer) => {
      return prosumer.processes.resources;
    });
    return new EnergyCalculation<ResourceTypes>(
      new ResourceCalculation(stock, ResourceProcessCollection.reduce(resources)),
      prosumers,
    );
  }

  /* get energy(): ResourceProcessCollection<Types> {
    return new ResourceProcessCollection<Types>({});
     this.prosumers.map((prosumer) => {

    });
  } */

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
    return new EnergyCalculation(resources, this.prosumers);
  }

  get prettyProsumers() {
    return this.prosumers.map((prosumer) => {
      return prosumer.toString();
    });
  }

  get energies() {
    return this.prosumers.map((prosumer) => {
      return prosumer.prosumes().energies;
    });
  }

  get prettyEnergy() {
    return this.prosumers.map((prosumer) => {
      return prosumer.prosumes()
        .prettyEnergies
        .filter((e) => { return e || e.length; })
        .join(", ");
    }).filter((p) => { return p || p.length; });
  }

  toString() {
    return `Processing energy&resources: ${this.productionTable.join(", ")}`;
    // return `${this.resources.stock}`;
  }

  /**
   * Should return entries like this:
   * - 10energy Prosumer(A, 1, 1) 89/112 or even -58
   * - 3tumbles(0, 5): +2
   * - 3salties(0, 3): -1
   */
  get productionTable(): string[] {
    /* const processes = this.resources.stockLimitedProcessCollection.map((process) => {
      return process.toString();
    });
    console.log(this.prettyProsumers);
    return processes.concat(...this.prettyProsumers, ...this.resources.entries); */
    return this.prettyEnergy.concat(...this.resources.entries);
  }
}
