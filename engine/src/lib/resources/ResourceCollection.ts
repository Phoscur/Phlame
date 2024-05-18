import {
  Resource,
  type ComparableResource,
  type ResourceIdentifier,
  type ResourceJSON,
} from './Resource';
import { Energy } from './Energy';

const RESOURCE_COLLECTION_TYPE = 'ResourceCollection';
export type ResourceArray = ComparableResource<ResourceIdentifier>[];

export type ResourceCollectionEntries<Types extends ResourceIdentifier> = {
  [Type in Types]?: ComparableResource<Type>;
};

export type ResourcesLike<Types extends ResourceIdentifier> =
  | ComparableResource<Types>
  | ResourceCollection<Types>;

// Cannot use <Types extends BaseResources>, because
// TypeScript enums are finite/closed: https://github.com/microsoft/TypeScript/issues/17592#issuecomment-528993663
export class ResourceCollection<Types extends ResourceIdentifier> {
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

  get asArray(): ComparableResource<Types>[] {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return */
    return Object.values(this.entries);
  }

  get prettyAmount(): string {
    return this.asArray
      .map((resource) => {
        return resource.prettyAmount;
      })
      .join(', ');
  }

  protected createByType<Type extends Types>(type: Type, amount = 0): ComparableResource<Type> {
    if (~Energy.types.indexOf(type)) {
      return new Energy(type, amount);
    }
    return new Resource(type, amount);
  }

  getByType<Type extends Types>(type: Type): ComparableResource<Type> | undefined {
    return this.entries[type];
  }

  get<Type extends Types>(type: Type): ComparableResource<Type> {
    return this.getByType(type) ?? this.createByType(type);
  }

  map<GenericReturn>(
    mappingFunction: (
      resource: ComparableResource<Types>,
      type: Types,
    ) => GenericReturn | undefined,
  ): GenericReturn[] {
    return this.types.reduce<GenericReturn[]>((entries: GenericReturn[], type: Types) => {
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      const entry = this.entries[type] as ComparableResource<Types>; // Can't cover an undefined typecheck in unit tests as it cannot be undefined
      const result = mappingFunction(entry, type);
      if (typeof result === 'undefined') {
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

  protected new(entries: ResourceCollectionEntries<Types>): ResourceCollection<Types> {
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

  equals(resourceCollection: ResourceCollection<Types>): boolean {
    return this.asArray.reduce((equal: boolean, resource: ComparableResource<Types>): boolean => {
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

  isMoreOrEquals(resource: ResourcesLike<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !!sameType && sameType.isMoreOrEquals(resource);
    }
    return this.asArray.reduce((isMore: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return isMore && !!sameType && entry.isMoreOrEquals(sameType);
    }, true);
  }

  isLessOrEquals(resource: ResourcesLike<Types>): boolean {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.getByType(resource.type);
      return !sameType || sameType.isLessOrEquals(resource);
    }
    return this.asArray.reduce((isLessOrEquals: boolean, entry) => {
      const sameType = resource.getByType(entry.type);
      return isLessOrEquals && (!sameType || entry.isLessOrEquals(sameType));
    }, true);
  }

  add(resource: ResourcesLike<Types>): ResourceCollection<Types> {
    if (!this.isResourceCollection(resource)) {
      const sameType = this.entries[resource.type];
      return this.new({
        ...this.entries,
        [resource.type]: !sameType ? resource : sameType.add(resource),
      });
    }
    const resources = this.asArray
      .map((entry) => {
        const add = resource.getByType(entry.type);
        return add ? entry.add(add) : entry;
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
        [resource.type]: !sameType ? resource : sameType.subtract(resource),
      });
    }
    return ResourceCollection.fromArray(
      this.asArray.map((entry) => {
        const subtract = resource.getByType(entry.type);
        return subtract ? entry.subtract(subtract) : entry;
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

  toString(): string {
    return `ResourceCollection[${this.prettyAmount}]`;
  }

  toJSON(): ResourceJSON<Types>[] {
    return this.map((r) => r.toJSON());
  }
}
