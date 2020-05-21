/* eslint class-methods-use-this: "off" */
import Resource, { ResourceIdentifier } from "./Resource";

const RESOURCE_COLLECTION_TYPE = "ResourceCollection";
export type ResourceArray = Resource<ResourceIdentifier>[];

export type ResourceCollectionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: Resource<Type>;
}

// Cannot use <Types extends BaseResources>, because
// TypeScript enums are finite/closed: https://github.com/microsoft/TypeScript/issues/17592#issuecomment-528993663
export default class ResourceCollection<Types extends ResourceIdentifier> {
  readonly type = RESOURCE_COLLECTION_TYPE;

  readonly entries: ResourceCollectionEntries<Types> = {};

  constructor(entries: ResourceCollectionEntries<Types>) {
    this.entries = entries;
  }

  static fromArray<Types extends ResourceIdentifier>(resources: ResourceArray): ResourceCollection<Types> {
    return new ResourceCollection<Types>(resources.reduce((entries, resource) => {
      return {
        ...entries,
        [resource.type]: resource,
      };
    }, {}));
  }

  get types(): Types[] {
    return Object.keys(this.entries) as Types[];
  }

  get asArray(): Resource<Types>[] {
    return Object.values(this.entries);
  }

  get prettyAmount(): string {
    return this.asArray.map((resource) => {
      return resource.prettyAmount;
    }).join(", ");
  }

  getByType<Type extends Types>(type: Type): Resource<Types>|undefined {
    return this.entries[type];
  }

  // This makes TypeScript understand if given object is a ResourceCollection or just a Resource
  protected isResourceCollection(
    resource: Resource<Types> | ResourceCollection<Types>,
  ): resource is ResourceCollection<Types> {
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
      const compareResource = resourceCollection.getByType(resource.type);
      if (!compareResource) {
        return false;
      }
      return resource.equals(compareResource);
    }, true);
  }

  isMoreOrEquals(resource: Resource<Types> | ResourceCollection<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !!sameType && sameType.isMoreOrEquals(resource);
    }
    return this.asArray.reduce((isMore: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return isMore && !!sameType && entry.isMoreOrEquals(sameType);
    }, true);
  }

  isLessOrEquals(resource: Resource<Types> | ResourceCollection<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !sameType || sameType.isLessOrEquals(resource);
    }
    return this.asArray.reduce((isLessOrEquals: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return isLessOrEquals && (!sameType || entry.isLessOrEquals(sameType));
    }, true);
  }

  add(resource: Resource<Types> | ResourceCollection<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
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
    return ResourceCollection.fromArray(resources);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param resource
   */
  subtract(resource: Resource<Types> | ResourceCollection<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.subtract(resource),
      });
    }
    return ResourceCollection.fromArray(this.asArray.map((entry) => {
      const subtract = resource.getByType(entry.type);
      return subtract ? entry.subtract(subtract) : entry;
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
