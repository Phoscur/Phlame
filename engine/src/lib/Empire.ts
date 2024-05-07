import type { ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import Phlame from './Phlame';
import { ID } from './Action';

export default class Empire<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  constructor(public id: ID, public entities: Phlame<ResourceType, BuildingType>[]) {}

  toString(): string {
    return `${this.id} [${this.entities.join(', ')}]`;
  }
}
