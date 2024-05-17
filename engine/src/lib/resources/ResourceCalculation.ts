import { ResourceIdentifier } from './Resource';
import { TimeUnit } from './ResourceProcess';
import { ResourceProcessCollection } from './ResourceProcessCollection';
import { Stock } from './Stock';

/**
 * [
 *   [rtype, rate, amount, max, min]
 *   [etype, rate, limit]
 * ]
 */
export type ResourceTable<T extends ResourceIdentifier> = [T, number, number, ...number[]][];
export class ResourceCalculation<Types extends ResourceIdentifier> {
  readonly processes: ResourceProcessCollection<Types>;

  readonly stock: Stock<Types>;

  constructor(stock: Stock<Types>, processes: ResourceProcessCollection<Types>) {
    this.processes = processes;
    this.stock = stock;
  }

  get stockLimitedProcessCollection(): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(
      this.processes.asArray.map((process) => {
        const limit =
          process.rate >= 0
            ? this.stock.getMaxResource(process.limit)
            : this.stock.getMinResource(process.limit);
        return process.newLimit(limit);
      }),
    );
  }

  get validFor(): TimeUnit {
    const {
      stockLimitedProcessCollection: { endsNextIn: stockLimit },
      processes: { endsNextIn: processLimit },
    } = this;
    return processLimit > stockLimit ? stockLimit : processLimit;
  }

  calculate(timeUnits: TimeUnit): ResourceCalculation<Types> {
    // No need to throw here, resources cannot be negative anyways
    // if (timeUnits > this.validFor + 1) {
    // throw new Error(`ResourceCalculation out of validity bounds: ${timeUnits} > ${this.validFor}`); }

    const addResources = this.processes.getPositiveResourcesFor(timeUnits);
    const removeResources = this.processes.getNegativeResourcesFor(timeUnits);
    const processes = this.processes.after(timeUnits);
    const stock = this.stock.store(addResources).fetch(removeResources);
    return new ResourceCalculation(stock, processes);
  }

  get entries(): string[] {
    return this.processes.asArray.map(({ rate, limit }) => {
      const resource = this.stock.has(limit.type);
      const stockLimits = this.stock.resourceLimitToString(resource);
      const ratePrefix = rate > 0 ? '+' : '';
      return `${stockLimits}: ${ratePrefix}${rate}`;
    });
  }

  get table(): ResourceTable<Types> {
    return this.processes.asArray.map(({ rate, limit }) => {
      const resource = this.stock.has(limit.type);
      const [min, max] = this.stock.getResourceLimits(resource);
      return [resource.type, rate, resource.amount, max, min];
    });
  }

  toString(): string {
    return `Processing resources: ${this.entries.join(', ')}`;
  }
}
