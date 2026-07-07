import type { ResourceIdentifier } from './Resource';
import type { TimeUnit } from './ResourceProcess';
import { ResourceCalculation, type ResourceTable } from './ResourceCalculation';
import { ResourceCollection } from './ResourceCollection';
import { ResourceProcess } from './ResourceProcess';
import type { ResourceProcessCollectionEntries } from './ResourceProcessCollection';
import { ResourceProcessCollection } from './ResourceProcessCollection';
import { Stock } from './Stock';
import { ProsumerCollection } from './ProsumerCollection';
import { Phormulae } from '../Phormulae';

export class EnergyCalculation<Types extends ResourceIdentifier> {
  /**
   * @deprecated shim delegating to `Phormulae.current` (ADR 0014)
   */
  static get REBALANCING_EXPONENT(): number {
    return Phormulae.current.rebalancingExponent;
  }

  readonly resources: ResourceCalculation<Types>;

  readonly prosumers: ProsumerCollection<Types>;

  constructor(resources: ResourceCalculation<Types>, prosumers: ProsumerCollection<Types>) {
    this.prosumers = prosumers;
    if (!prosumers.isUnbalanced) {
      this.resources = resources;
    } else {
      // apply deficit multiplier on imbalanced production
      this.resources = new ResourceCalculation(
        resources.stock,
        prosumers.rebalancedResources(this.balanceFactor),
      );
    }
  }

  static newStock<ResourceTypes extends ResourceIdentifier>(
    stock: Stock<ResourceTypes>,
    prosumers: ProsumerCollection<ResourceTypes>,
  ): EnergyCalculation<ResourceTypes> {
    return new EnergyCalculation<ResourceTypes>(
      new ResourceCalculation(stock, prosumers.resources),
      prosumers,
    );
  }

  get validFor(): TimeUnit {
    // as energies just influence the balance after recalculations, this can be simply delegated - until e.g. a heat limit could be reached
    return this.resources.validFor;
  }

  get stock(): Stock<Types> {
    return this.resources.stock;
  }

  get balanceFactor(): number {
    return this.prosumers.balanceFactor ** EnergyCalculation.REBALANCING_EXPONENT;
  }

  hasAvailable(resources: ResourceCollection<Types>): boolean {
    // TODO check for energy seperately?
    return this.resources.stock.isFetchable(resources);
  }

  calculate(timeUnits: TimeUnit): EnergyCalculation<Types> {
    const resources = this.resources.calculate(timeUnits);
    return new EnergyCalculation(resources, this.prosumers);
  }

  get prettyProsumers(): string[] {
    return this.prosumers.map((prosumer) => {
      return prosumer.toString();
    });
  }

  get energies(): ResourceProcessCollection<Types> {
    const energies = this.prosumers.map((prosumer) => {
      return prosumer.prosumes.energies;
    });
    const limits = energies.reduce((l: ResourceProcessCollectionEntries<Types>, es) => {
      es.asArray.forEach((energy) => {
        if (energy.isNegative) {
          return;
        }
        const e = energy.limitFromRate();
        // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
        const limit = l[energy.type] as ResourceProcess<Types>;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        l[energy.type] = !limit ? e : limit.addLimit(e.limit);
      });
      return l;
    }, {});
    // Sum the rates across all prosumers, then apply the production capacity (limits)
    // as each energy's limit: combining limits through add() instead would apply
    // stock-withdrawal semantics (summing limits) once the net rate turns negative
    const combined = ResourceProcessCollection.reduce([...energies]);
    return ResourceProcessCollection.fromArray(
      combined.map((energy) => {
        const capacity = limits[energy.type];
        return capacity ? energy.newLimit(capacity.limit) : energy;
      }),
    );
  }

  get prettyEnergy(): string[] {
    return this.energies.map((energy) => {
      return `${energy.rate}/${energy.limit.amount} ${energy.type}`;
    });
  }

  toString(): string {
    return `Processing energy&resources: ${this.productionEntries.join(', ')}`;
  }

  /**
   * Should return entries like this:
   * - 89/112 energy
   * - 3tumbles(0, 5): +2
   * - 3salties(0, 3): -1
   */
  get productionEntries(): string[] {
    const energies = this.prettyEnergy;
    if (this.balanceFactor < 1) {
      energies.push(`Degraded to ${Math.round(this.balanceFactor * 100)}%`);
    }
    return energies.concat(...this.resources.entries);
  }

  get productionTable(): ResourceTable<Types> {
    return [
      ...this.energies.map(
        (energy: ResourceProcess<Types>) =>
          [energy.type, energy.rate, energy.limit.amount] as [Types, number, number],
      ),
      ...this.resources.table,
    ];
  }
}
