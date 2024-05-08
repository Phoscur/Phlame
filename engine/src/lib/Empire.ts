import type { ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import { Phlame } from './Phlame';
import { Entity, ID } from './Action';

export class Empire<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> implements Entity
{
  constructor(public id: ID, public entities: Phlame<ResourceType, BuildingType>[]) {}

  toString(): string {
    return `${this.id} [${this.entities.join(', ')}]`;
  }
}
