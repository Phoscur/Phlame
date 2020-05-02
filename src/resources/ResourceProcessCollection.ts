/* eslint class-methods-use-this: "off" */
import ResourceProcess from "./ResourceProcess";

export interface ResourceProcessCollectionEntries {
  [type: string]: ResourceProcess;
}
const RESOURCE_PROCESS_COLLECTION_TYPE = "ResourceProcessCollection";
export default class ResourceProcessCollection {
  readonly type = RESOURCE_PROCESS_COLLECTION_TYPE;

  readonly entries: ResourceProcessCollectionEntries = {};

  constructor(entries: ResourceProcessCollectionEntries) {
    this.entries = entries;
  }

  static fromArray(resources: ResourceProcess[]): ResourceProcessCollection {
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

  get asArray(): ResourceProcess[] {
    return this.types.map((type) => {
      return this.entries[type];
    });
  }

  get prettyAmount(): string {
    return this.asArray.map((resource) => {
      return resource.limit.prettyAmount;
    }).join(", ");
  }

  // This makes TypeScript understand if given object is a ResourceProcessCollection or just a ResourceProcess
  protected isResourceProcessCollection(
    process: ResourceProcess|ResourceProcessCollection,
  ): process is ResourceProcessCollection {
    return process.type === RESOURCE_PROCESS_COLLECTION_TYPE;
  }

  protected new(entries: ResourceProcessCollectionEntries) {
    return new ResourceProcessCollection(entries);
  }

  get zero(): ResourceProcessCollection {
    return ResourceProcessCollection.fromArray(this.asArray.map((resourceProcess) => {
      return new ResourceProcess(resourceProcess.limit.zero, resourceProcess.rate);
    }));
  }

  get infinite(): ResourceProcessCollection {
    return ResourceProcessCollection.fromArray(this.asArray.map((resourceProcess) => {
      return new ResourceProcess(resourceProcess.limit.infinite, resourceProcess.rate);
    }));
  }

  equals(resourceCollection: ResourceProcessCollection) {
    return this.asArray.reduce((equal, resource) => {
      if (!equal) {
        return false;
      }
      return resource.equals(resourceCollection.entries[resource.type]);
    }, true);
  }

  add(resource: ResourceProcess) {
    if (!this.isResourceProcessCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.add(resource),
      });
    }
    const resources = this.asArray.map((entry) => {
      return entry.add(resource.entries[entry.type]);
    }).concat(resource.asArray.filter((res) => {
      return !this.entries[res.type];
    }));
    return ResourceProcessCollection.fromArray(resources);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param resource
   */
  subtract(resource: ResourceProcess) {
    if (!this.isResourceProcessCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.subtract(resource),
      });
    }
    return ResourceProcessCollection.fromArray(this.asArray.map((entry) => {
      return entry.subtract(resource.entries[entry.type]);
    }));
  }

  toString() {
    return `ResourceProcessCollection[${this.prettyAmount}]`;
  }
}
