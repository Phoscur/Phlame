/* eslint class-methods-use-this: "off" */
import Resource, { ResourceIdentifier } from "./Resource";
import Energy from "./Energy";

const RESOURCE_COLLECTION_TYPE = "ResourceCollection";
export type ResourceArray = (Resource<ResourceIdentifier> | Energy<ResourceIdentifier>)[];

export type ResourceCollectionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: Resource<Type> | Energy<Type>;
};

export type ResourceLike<Types extends ResourceIdentifier> = Resource<Types> | Energy<Types>;
export type ResourcesLike<Types extends ResourceIdentifier> =
  | ResourceLike<Types>
  | ResourceCollection<Types>;

// Cannot use <Types extends BaseResources>, because
// TypeScript enums are finite/closed: https://github.com/microsoft/TypeScript/issues/17592#issuecomment-528993663
export default class ResourceCollection<Types extends ResourceIdentifier> {
  static TYPE = RESOURCE_COLLECTION_TYPE;
  readonly type = RESOURCE_COLLECTION_TYPE;

  readonly entries: ResourceCollectionEntries<Types> = {};

  constructor(entries: ResourceCollectionEntries<Types>) {
    this.entries = entries;
  }

  static fromArray<Types extends ResourceIdentifier>(
    resources: ResourceArray,
  ): ResourceCollection<Types> {
    return new ResourceCollection<Types>(
      resources.reduce((entries, resource) => {
        return {
          ...entries,
          [resource.type]: resource,
        };
      }, {}),
    );
  }

  get types(): Types[] {
    return Object.keys(this.entries) as Types[];
  }

  get asArray(): Resource<Types>[] {
    return Object.values(this.entries);
  }

  get prettyAmount(): string {
    return this.asArray
      .map((resource) => {
        return resource.prettyAmount;
      })
      .join(", ");
  }

  protected createByType<Type extends Types>(type: Type, amount = 0): ResourceLike<Type> {
    if (~Energy.types.indexOf(type)) {
      return new Energy(type, amount);
    }
    return new Resource(type, amount);
  }

  getByType<Type extends Types>(type: Type): ResourceLike<Type> | undefined {
    return this.entries[type];
  }

  get<Type extends Types>(type: Type): Resource<Type> | Energy<Type> {
    return this.getByType(type) || this.createByType(type);
  }

  map<GenericReturn>(
    mappingFunction: (resource: ResourceLike<Types>, type: Types) => GenericReturn | undefined,
  ): GenericReturn[] {
    return this.types.reduce<GenericReturn[]>((entries: GenericReturn[], type: Types) => {
      const entry = this.entries[type] as Resource<Types> | Energy<Types>; // Can't cover an undefined typecheck in unit tests as it cannot be undefined
      const result = mappingFunction(entry, type);
      if (typeof result === "undefined") {
        return entries;
      }
      entries.push(result);
      return entries;
    }, []);
  }

  // This makes TypeScript understand if given object is a ResourceCollection or just a Resource
  protected isResourceCollection(
    resource: ResourcesLike<Types>,
  ): resource is ResourceCollection<Types> {
    return resource.type === RESOURCE_COLLECTION_TYPE;
  }

  protected new(entries: ResourceCollectionEntries<Types>) {
    return new ResourceCollection(entries);
  }

  get zero(): ResourceCollection<Types> {
    return ResourceCollection.fromArray(
      this.asArray.map((resource) => {
        return resource.zero;
      }),
    );
  }

  get infinite(): ResourceCollection<Types> {
    return ResourceCollection.fromArray(
      this.asArray.map((resource) => {
        return resource.infinite;
      }),
    );
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
      return resource.equals(compareResource as Resource<Types> & Energy<Types>);
    }, true);
  }

  isMoreOrEquals(resource: ResourcesLike<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !!sameType && sameType.isMoreOrEquals(resource as Resource<Types> & Energy<Types>);
    }
    return this.asArray.reduce((isMore: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return (
        isMore && !!sameType && entry.isMoreOrEquals(sameType as Resource<Types> & Energy<Types>)
      );
    }, true);
  }

  isLessOrEquals(resource: ResourcesLike<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !sameType || sameType.isLessOrEquals(resource as Resource<Types> & Energy<Types>);
    }
    return this.asArray.reduce((isLessOrEquals: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return (
        isLessOrEquals &&
        (!sameType || entry.isLessOrEquals(sameType as Resource<Types> & Energy<Types>))
      );
    }, true);
  }

  add(resource: ResourcesLike<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType
          ? resource
          : sameType.add(resource as Resource<Types> & Energy<Types>),
      });
    }
    const resources = this.asArray
      .map((entry) => {
        const add = resource.getByType(entry.type);
        return add ? entry.add(add as Resource<Types> & Energy<Types>) : entry;
      })
      .concat(
        resource.asArray.filter((res) => {
          return !this.entries[res.type];
        }),
      );
    return ResourceCollection.fromArray(resources);
  }

  /**
   * Substract another resource
   * Warning! Returns zero if the result would be negative.
   * @param resource
   */
  subtract(resource: ResourcesLike<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType
          ? resource
          : sameType.subtract(resource as Resource<Types> & Energy<Types>),
      });
    }
    return ResourceCollection.fromArray(
      this.asArray.map((entry) => {
        const subtract = resource.getByType(entry.type);
        return subtract ? entry.subtract(subtract as Resource<Types> & Energy<Types>) : entry;
      }),
    );
  }

  times(factor: number): ResourceCollection<Types> {
    return ResourceCollection.fromArray(
      this.asArray.map((resource) => {
        return resource.times(factor);
      }),
    );
  }

  toString() {
    return `ResourceCollection[${this.prettyAmount}]`;
  }
}
