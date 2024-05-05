import type { ResourceIdentifier } from './resources';
import { Stock } from './resources';
import Building, { BuildingIdentifier } from './Building';
import Phlame from './Phlame';

export default class Empire<
  BuildingType extends BuildingIdentifier,
  ResourceType extends ResourceIdentifier,
> {
  constructor(public name: string, public entities: Phlame<ResourceType, BuildingType>[]) {}

  toString(): string {
    return `${this.name} [${this.entities.join(', ')}]`;
  }
}
