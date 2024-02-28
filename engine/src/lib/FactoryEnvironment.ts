import type { ResourceIdentifier } from './resources';
import { Stock } from './resources';

export default class FactoryEnvironment<Types extends ResourceIdentifier> {
  // TODO add other properties, as a map?

  constructor(public readonly name: string, public readonly resources: Stock<Types>) {}

  toString(): string {
    return `${this.name} (${this.resources})`;
  }
}
