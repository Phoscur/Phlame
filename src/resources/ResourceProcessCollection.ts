/* eslint class-methods-use-this: "off" */
import { ResourceIdentifier } from "./Resource";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceCollection from "./ResourceCollection";

export type ResourceProcessCollectionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: ResourceProcess<Type>;
}
const RESOURCE_PROCESS_COLLECTION_TYPE = "ResourceProcessCollection";
export default class ResourceProcessCollection<Types extends ResourceIdentifier> {
  readonly type = RESOURCE_PROCESS_COLLECTION_TYPE;

  readonly entries: ResourceProcessCollectionEntries<Types> = {};

  constructor(entries: ResourceProcessCollectionEntries<Types>) {
    this.entries = entries;
  }

  static fromArray<Types extends ResourceIdentifier>(
    resources: ResourceProcess<Types>[],
  ): ResourceProcessCollection<Types> {
    return new ResourceProcessCollection(resources.reduce((entries, resource) => {
      return {
        ...entries,
        [resource.type]: resource,
      };
    }, {}));
  }

  get types(): string[] {
    return Object.keys(this.entries);
  }

  get asArray(): ResourceProcess<Types>[] {
    return Object.values(this.entries);
  }

  get prettyAmount(): string {
    return this.asArray.map((process) => {
      const ratePrefix = process.rate >= 0 ? "+" : "";
      return `${process.limit.prettyAmount}${ratePrefix}${process.rate}`;
    }).join(", ");
  }

  getByType<Type extends Types>(type: Type): ResourceProcess<Types>|undefined {
    return this.entries[type];
  }

  // This makes TypeScript understand if given object is a ResourceProcessCollection or just a ResourceProcess
  protected isResourceProcessCollection(
    process: ResourceProcess<Types> | ResourceProcessCollection<Types>,
  ): process is ResourceProcessCollection<Types> {
    return process.type === RESOURCE_PROCESS_COLLECTION_TYPE;
  }

  protected new(entries: ResourceProcessCollectionEntries<Types>) {
    return new ResourceProcessCollection(entries);
  }

  get zero(): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(this.asArray.map((resourceProcess) => {
      return new ResourceProcess(resourceProcess.limit.zero, resourceProcess.rate);
    }));
  }

  get infinite(): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(this.asArray.map((resourceProcess) => {
      return new ResourceProcess(resourceProcess.limit.infinite, resourceProcess.rate);
    }));
  }

  equals(resourceCollection: ResourceProcessCollection<Types>) {
    return this.asArray.reduce((equal, resource) => {
      if (!equal) {
        return false;
      }
      const compareResource = resourceCollection.getByType(resource.type);
      if (!compareResource) {
        return false;
      }
      return resource.equals(compareResource);
    }, true);
  }

  add(resource: ResourceProcess<Types> | ResourceProcessCollection<Types>): ResourceProcessCollection<Types> {
    if (!this.isResourceProcessCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.add(resource),
      });
    }
    const resources = this.asArray.map((entry) => {
      const add = resource.getByType(entry.type);
      return add ? entry.add(add) : entry;
    }).concat(resource.asArray.filter((res) => {
      return !this.entries[res.type];
    }));
    return ResourceProcessCollection.fromArray(resources);
  }

  /**
   * Substract another resource process (rate)
   * @param resource
   */
  subtract(resource: ResourceProcess<Types> | ResourceProcessCollection<Types>): ResourceProcessCollection<Types> {
    if (!this.isResourceProcessCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource.negative : sameType.subtract(resource),
      });
    }
    const resources = this.asArray.map((entry) => {
      const subtract = resource.getByType(entry.type);
      return subtract ? entry.subtract(subtract) : entry;
    }).concat(
      resource.asArray
        .filter((res) => { return !this.entries[res.type]; })
        .map((process) => { return process.negative; }),
    );
    return ResourceProcessCollection.fromArray(resources);
  }

  get endsNextIn(): TimeUnit {
    return this.asArray.reduce((minimum, process) => {
      const { endsIn } = process;
      return endsIn < minimum ? endsIn : minimum;
    }, Number.POSITIVE_INFINITY);
  }

  /**
   * Calculates resources generated from positive processes during given time
   * @param timeUnits
   */
  getPositiveResourcesFor(timeUnits: TimeUnit): ResourceCollection<Types> {
    return ResourceCollection.fromArray(this.asArray.map((resourceProcess) => {
      if (resourceProcess.isNegative) {
        return resourceProcess.limit.zero;
      }
      return resourceProcess.getResourceFor(timeUnits);
    }));
  }

  /**
   * Calculates resources consumed by negative processes during given time
   * @param timeUnits
   */
  getNegativeResourcesFor(timeUnits: TimeUnit): ResourceCollection<Types> {
    return ResourceCollection.fromArray(this.asArray.map((resourceProcess) => {
      if (!resourceProcess.isNegative) {
        return resourceProcess.limit.zero;
      }
      return resourceProcess.getResourceFor(timeUnits);
    }));
  }

  /**
   * Get the same resource processes after a given time (with limits adjusted)
   * @param timeUnits
   */
  after(timeUnits: TimeUnit) {
    return ResourceProcessCollection.fromArray(this.asArray.map((resourceProcess) => {
      return resourceProcess.after(timeUnits);
    }));
  }

  toString() {
    return `ResourceProcessCollection[${this.prettyAmount}]`;
  }
}
