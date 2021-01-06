/* eslint class-methods-use-this: "off" */
import type { ResourceIdentifier } from "./Resource";
import Resource from "./Resource";
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

  /**
   * Add resource processes together
   * @param processCollections to be compacted
   */
  static reduce<Types extends ResourceIdentifier>(
    processCollections: ResourceProcessCollection<Types>[],
  ): ResourceProcessCollection<Types> {
    if (processCollections.length < 2) {
      return processCollections[0] || ResourceProcessCollection.fromArray([]);
    }
    const last = processCollections.pop() as ResourceProcessCollection<Types>; // Just checked it to be not undefined!
    return processCollections.reduce((reduced, processCollection) => {
      return reduced.add(processCollection);
    }, last);
  }

  get types(): Types[] {
    return Object.keys(this.entries) as Types[];
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

  get resources(): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(this.asArray.filter((process) => {
      return !process.limit.isEnergy;
    }));
  }

  get energies(): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(this.asArray.filter((process) => {
      return process.limit.isEnergy;
    }));
  }

  get prettyEnergies(): string[] {
    return this.energies.asArray.map((process) => {
      return `${process.limit.amount} ${process.limit.type}`;
    });
  }

  getByType<Type extends Types>(type: Type): ResourceProcess<Type>|undefined {
    return this.entries[type];
  }

  protected newResource(type: Types, amount: number) {
    return new Resource(type, amount);
  }

  get<Type extends Types>(type: Type): ResourceProcess<Types> {
    return this.getByType(type) || new ResourceProcess(this.newResource(type, 0), 0);
  }

  map<GenericReturn>(mappingFunction: (resource: ResourceProcess<Types>, type: Types) => GenericReturn | undefined): GenericReturn[] {
    return this.types.reduce<GenericReturn[]>((entries: GenericReturn[], type: Types) => {
      const entry = this.entries[type] as ResourceProcess<Types>; // Can't cover an undefined typecheck in unit tests as it cannot be undefined
      const result = mappingFunction(entry, type);
      if (typeof result === "undefined") {
        return entries;
      }
      entries.push(result);
      return entries;
    }, []);
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

  newRateMultiplier(speed: number): ResourceProcessCollection<Types> {
    return ResourceProcessCollection.fromArray(this.map((process) => {
      return process.newRate(process.rate * speed);
    }));
  }

  addLimits(limits: ResourceProcessCollectionEntries<Types>) {
    const s = ResourceProcessCollection.fromArray(this.asArray.map((p) => {
      if (p.isNegative) {
        return p;
      }
      const { type } = p;
      const limit = limits[type]?.limit;
      return p.addLimit(limit);
    }));
    return s;
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

  get isEmpty(): boolean {
    return Object.keys(this.entries).length === 0;
  }

  /* YAGNI?
  get isZero(): boolean {
    return this.equals(this.zero);
  }

  isMoreThan(resourceCollection: ResourceProcessCollection<Types>) {  }*/

  get endsNextIn(): TimeUnit {
    return this.asArray.reduce((minimum, process) => {
      const { endsIn } = process;
      return endsIn < minimum ? endsIn : minimum;
    }, Number.POSITIVE_INFINITY);
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
