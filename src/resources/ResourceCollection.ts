/* eslint class-methods-use-this: "off" */
import Resource from "./Resource";

export interface ResourceCollectionEntries {
  [resourceType: string]: Resource;
}
const RESOURCE_COLLECTION_TYPE = "ResourceCollection";
export default class ResourceCollection {
  readonly type = RESOURCE_COLLECTION_TYPE;

  readonly entries: ResourceCollectionEntries = {};

  constructor(entries: ResourceCollectionEntries) {
    this.entries = entries;
  }

  static fromArray(resources: Resource[]): ResourceCollection {
    return new ResourceCollection(resources.reduce((entries, resource) => {
      return {
        ...entries,
        [resource.type]: resource,
      };
    }, {}));
  }

  get types(): string[] {
    return Object.keys(this.entries);
  }

  get asArray(): Resource[] {
    return this.types.map((type) => {
      return this.entries[type];
    });
  }

  get prettyAmount(): string {
    return this.asArray.map((resource) => {
      return resource.prettyAmount;
    }).join(", ");
  }

  // This makes TypeScript understand if given object is a ResourceCollection or just a Resource
  protected isResourceCollection(resource: Resource|ResourceCollection): resource is ResourceCollection {
    return resource.type === RESOURCE_COLLECTION_TYPE;
  }

  protected new(entries: ResourceCollectionEntries) {
    return new ResourceCollection(entries);
  }

  get zero(): ResourceCollection {
    return this.new({});
  }

  equals(resourceCollection: ResourceCollection) {
    return this.asArray.reduce((equal, resource) => {
      if (!equal) {
        return false;
      }
      return resource.equals(resourceCollection.entries[resource.type]);
    }, true);
  }

  isMoreOrEquals(resource: ResourceCollection|Resource) {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return !!sameType && sameType.isMoreOrEquals(resource);
    }
    return this.asArray.reduce((isMore, entry) => {
      const sameType = resource.entries[entry.type];
      return isMore && !!sameType && entry.isMoreOrEquals(sameType);
    }, true);
  }

  isLessOrEquals(resource: ResourceCollection|Resource) {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return !sameType || sameType.isLessOrEquals(resource);
    }
    return this.asArray.reduce((isLessOrEquals, entry) => {
      const sameType = resource.entries[entry.type];
      return isLessOrEquals && (!sameType || entry.isLessOrEquals(sameType));
    }, true);
  }

  add(resource: Resource) {
    const sameType = this.entries[resource.type];
    return this.new({
      ...this.entries,
      [resource.type]: !sameType ? resource : sameType.add(resource),
    });
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param resource
   */
  subtract(resource: Resource) {
    const sameType = this.entries[resource.type];
    return this.new({
      ...this.entries,
      [resource.type]: !sameType ? resource : sameType.subtract(resource),
    });
  }

  times(factor: number) {
    return ResourceCollection.fromArray(this.asArray.map((resource) => {
      return resource.times(factor);
    }));
  }

  toString() {
    return `ResourceCollection[${this.prettyAmount}]`;
  }
}
