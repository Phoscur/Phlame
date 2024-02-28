import { ResourceIdentifier } from './Resource';
import Prosumer from './Prosumer';
import ResourceProcessCollection from './ResourceProcessCollection';

export default class ProsumerCollection<ResourceTypes extends ResourceIdentifier> {
  readonly prosumers: Prosumer<ResourceTypes>[];

  constructor(prosumers: Prosumer<ResourceTypes>[]) {
    this.prosumers = prosumers;
  }

  /**
   * All non-energy resource processes combined in one collection
   */
  get resources(): ResourceProcessCollection<ResourceTypes> {
    const processes = this.prosumers.map((p) => p.resources);
    return ResourceProcessCollection.reduce(processes);
  }

  /**
   * All resource processes combined in one collection
   */
  get reduced(): ResourceProcessCollection<ResourceTypes> {
    return ResourceProcessCollection.reduce(
      this.prosumers.map((p) => {
        return p.prosumes;
      }),
    );
  }

  get reducedProduction(): ResourceProcessCollection<ResourceTypes> {
    return ResourceProcessCollection.reduce(
      this.prosumers.map((p) => {
        return ResourceProcessCollection.fromArray(
          p.prosumes.map((process) => {
            if (process.isNegative) {
              return undefined;
            }
            return process;
          }),
        );
      }),
    );
  }

  get reducedConsumption(): ResourceProcessCollection<ResourceTypes> {
    return ResourceProcessCollection.reduce(
      this.prosumers.map((p) => {
        return ResourceProcessCollection.fromArray(
          p.prosumes.map((process) => {
            if (!process.isNegative) {
              return undefined;
            }
            return process;
          }),
        );
      }),
    );
  }

  get isUnbalanced(): boolean {
    // non energies are irrelevant
    if (this.reduced.energies.isEmpty) {
      return false;
    }
    return this.balanceFactor < 1;
  }

  get balanceFactor(): number {
    const { energies } = this.reduced;
    const producedEnergy = this.reducedProduction.energies;
    return energies.asArray.reduce((factor, e) => {
      if (!e.isNegative) {
        return factor;
      }
      const produced = producedEnergy.get(e.type).rate;
      const rate = Math.abs(e.rate);
      // energy quotient
      return produced / (rate + produced);
    }, 1);
  }

  map<GenericReturn>(
    mappingFunction: (prosumer: Prosumer<ResourceTypes>) => GenericReturn,
  ): GenericReturn[] {
    return this.prosumers.reduce<GenericReturn[]>(
      (entries: GenericReturn[], prosumer: Prosumer<ResourceTypes>) => {
        const result = mappingFunction(prosumer);
        if (typeof result === 'undefined') {
          return entries;
        }
        entries.push(result);
        return entries;
      },
      [],
    );
  }

  rebalancedResources(factor: number): ResourceProcessCollection<ResourceTypes> {
    // balance factor only affects production of resources
    const production = this.reducedProduction.resources.newRateMultiplier(factor);
    return production.add(this.reducedConsumption.resources);
  }

  toString(): string {
    return `ProsumerCollection[${this.prosumers.join(', ')}]`;
  }
}
