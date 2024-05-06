import type { ResourceIdentifier } from './resources';
import type { BuildingIdentifier } from './Building';
import Phlame from './Phlame';

export default class Empire<
  ResourceType extends ResourceIdentifier,
  BuildingType extends BuildingIdentifier,
> {
  constructor(public name: string, public entities: Phlame<ResourceType, BuildingType>[]) {}

  toString(): string {
    return `${this.name} [${this.entities.join(', ')}]`;
  }
}
