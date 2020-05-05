/* eslint class-methods-use-this: "off" */
import Resource from "./Resource";

export interface ResourceCollectionEntries<Types> {
  [resourceType: string]: Resource<keyof Types>;
}
const RESOURCE_COLLECTION_TYPE = "ResourceCollection";
export type Resources = Resource<any> | ResourceCollection<any>;
export default class ResourceCollection<Types> {
  readonly type = RESOURCE_COLLECTION_TYPE;

  readonly entries: ResourceCollectionEntries<Types> = {};

  constructor(entries: ResourceCollectionEntries<Types>) {
    this.entries = entries;
  }

  // TODO is this possible without any
  static fromArray(resources: Resource<any>[]): ResourceCollection<any> {
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

  get asArray(): Resource<any>[] {
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
  protected isResourceCollection(resource: Resources): resource is ResourceCollection<Types> {
    return resource.type === RESOURCE_COLLECTION_TYPE;
  }

  protected new(entries: ResourceCollectionEntries<Types>) {
    return new ResourceCollection(entries);
  }

  get zero(): ResourceCollection<Types> {
    return ResourceCollection.fromArray(this.asArray.map((resource) => {
      return resource.zero;
    }));
  }

  get infinite(): ResourceCollection<Types> {
    return ResourceCollection.fromArray(this.asArray.map((resource) => {
      return resource.infinite;
    }));
  }

  equals(resourceCollection: ResourceCollection<Types>) {
    return this.asArray.reduce((equal, resource) => {
      if (!equal) {
        return false;
      }
      return resource.equals(resourceCollection.entries[resource.type]);
    }, true);
  }

  isMoreOrEquals(resource: Resources): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type as string];
      return !!sameType && sameType.isMoreOrEquals(resource);
    }
    return this.asArray.reduce((isMore: boolean, entry) => {
      const sameType = resource.entries[entry.type as string];
      return isMore && !!sameType && entry.isMoreOrEquals(sameType);
    }, true);
  }

  isLessOrEquals(resource: Resources): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type as string];
      return !sameType || sameType.isLessOrEquals(resource);
    }
    return this.asArray.reduce((isLessOrEquals: boolean, entry) => {
      const sameType = resource.entries[entry.type as string];
      return isLessOrEquals && (!sameType || entry.isLessOrEquals(sameType));
    }, true);
  }

  add(resource: Resource<keyof Types>|ResourceCollection<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type as string];
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
    return ResourceCollection.fromArray(resources);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param resource
   */
  subtract(resource: Resource<keyof Types>|ResourceCollection<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type as string];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.subtract(resource),
      });
    }
    return ResourceCollection.fromArray(this.asArray.map((entry) => {
      return entry.subtract(resource.entries[entry.type as string]);
    }));
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
