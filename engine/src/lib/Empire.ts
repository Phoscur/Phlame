import type { ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import { Phlame, PhlameJSON } from './Phlame';
import { Entity, ID } from './Action';

export interface EmpireJSON<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  id: ID;
  entities: PhlameJSON<ResourceType, BuildingType>[];
};

export class Empire<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> implements Entity
{
  constructor(public id: ID, public entities: Phlame<ResourceType, BuildingType>[]) {}

  toString(): string {
    return `${this.id} [${this.entities.join(', ')}]`;
  }

  toJSON() {
    return {
      id: this.id,
      entities: this.entities.map((e) => e.toJSON()),
    };
  }
}
