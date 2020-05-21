
import { ResourceIdentifier } from "./Resource";
import { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Stock from "./Stock";

export default class ResourceCalculation<Types extends ResourceIdentifier> {
  readonly processes: ResourceProcessCollection<Types>;

  readonly stock: Stock<Types>;

  constructor(stock: Stock<Types>, processes: ResourceProcessCollection<Types>) {
    this.processes = processes;
    this.stock = stock;
  }

  get stockLimitedProcessCollection() {
    return ResourceProcessCollection.fromArray(this.processes.asArray.map((process) => {
      const limit = process.rate >= 0
        ? this.stock.getUpperLimitByType(process.limit)
        : this.stock.getNegativeLimitByType(process.limit);
      return process.newLimit(limit);
    }));
  }

  get validFor(): TimeUnit {
    const {
      stockLimitedProcessCollection: { endsNextIn: stockLimit },
      processes: { endsNextIn: processLimit },
    } = this;
    return processLimit > stockLimit ? stockLimit : processLimit;
  }

  calculate(timeUnits: TimeUnit) {
    const addResources = this.processes.getPositiveResourcesFor(timeUnits);
    const removeResources = this.processes.getNegativeResourcesFor(timeUnits);
    const processes = this.processes.after(timeUnits);
    const stock = this.stock.store(addResources).fetch(removeResources);
    return new ResourceCalculation(stock, processes);
  }

  entriesToString(): string[] {
    return this.processes.asArray.map(({ rate, type }) => {
      const resource = this.stock.getByType(type);
      if (!resource) {
        return "";
      }
      const stockLimits = this.stock.resourceLimitToString(resource);
      const ratePrefix = rate > 0 ? "+" : "";
      return `${stockLimits}: ${ratePrefix}${rate}`;
    });
  }

  toString() {
    return `Processing resources: ${this.entriesToString().join(", ")}`;
  }
}
