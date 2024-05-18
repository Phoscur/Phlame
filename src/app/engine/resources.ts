import {
  BaseResources,
  ComparableResource,
  Energy,
  Resource,
  ResourceCollection,
  ResourceJSON,
} from '@phlame/engine';

export enum ResourceTypes {
  // (partially) liquid - reactive non-metals
  Liquid = 'liquid',
  // Hydrogen = 'H', // P1-1
  // Deuterium = 'D', // P1-1 (2H)
  // Tritium = 'T', // P1-1   (3H)
  // Helium = 'He', // P2-18
  // Lithium = 'Li', // P3-1-2
  // Biomass = 'biomass',
  // Carbon = 'C', // P6-14-2
  // Nitrogen = 'N', // P7-15-3
  // Oxygen = 'O', // P8-16-2
  // Phosphorus = 'P', // P15-15-3
  // crystalline - metalloids
  Crystalline = 'crystalline',
  // Boron = 'B', // P5-13-2
  // Silicon = 'Si', // P14-14-3
  // metallic metals
  Metallic = 'metallic',
  // Cobalt = 'Co', // P27-9-4
  // Titanium = 'Ti', // P22-4-4
  // Iron = 'Fe', // P26-8-4
  // Copper = 'Cu', // P29-11-4
  // [...] need more Elements from the periodic table? https://ptable.com
  // Uranium = 'U', // P92-3-7
  // TODO what do we have all those special resource types for!
  // The current basic types should become placeholders or titles for resource summaries...
}
// TODO? refactor use "as const" (instead of enum)

export enum EnergyTypes {
  Electricity = 'energy',
  // Heat = 'heat',
}

// export type Types = ResourceTypes | EnergyTypes | BaseResources;
export type ResourceIdentifier = keyof typeof resources;

// Add new resources to known resource types - only categories for now
const newResourceTypes: ResourceIdentifier[] = [
  ResourceTypes.Metallic,
  ResourceTypes.Crystalline,
  ResourceTypes.Liquid,
];
const newEnergyTypes: ResourceIdentifier[] = [EnergyTypes.Electricity]; // TODO? , EnergyTypes.Heat];
Resource.types.push(...newResourceTypes);
Energy.types.push(...newEnergyTypes);

export class MetallicResource extends Resource<ResourceTypes.Metallic> {
  constructor(amount: number) {
    super(ResourceTypes.Metallic, amount);
  }
}

export class CrystallineResource extends Resource<ResourceTypes.Crystalline> {
  constructor(amount: number) {
    super(ResourceTypes.Crystalline, amount);
  }
}

export class LiquidResource extends Resource<ResourceTypes.Liquid> {
  constructor(amount: number) {
    super(ResourceTypes.Liquid, amount);
  }
}

export class EnergyResource extends Energy<EnergyTypes.Electricity> {
  constructor(amount: number) {
    super(EnergyTypes.Electricity, amount);
  }
}
/* *
 * Heat as another energy example type, yes!
 * Geoengineering allows to change a planets temperature for example, which has a huge impact on the ecology
 * The game physics of temperature could be similar to energy level
 * /
export class HeatResource extends Energy<EnergyTypes.Heat> {
  constructor(amount: number) {
    super(EnergyTypes.Heat, amount);
  }
}*/

export type ResourceType = MetallicResource | CrystallineResource | BaseResources;
export type EnergyType = EnergyResource;

export const resources = {
  null: (amount: number) => Resource.Null,
  [ResourceTypes.Metallic]: (amount: number) => new MetallicResource(amount),
  [ResourceTypes.Crystalline]: (amount: number) => new CrystallineResource(amount),
  [ResourceTypes.Liquid]: (amount: number) => new LiquidResource(amount),
  [EnergyTypes.Electricity]: (amount: number) => new EnergyResource(amount),
} as const;

export const zeroResources = ResourceCollection.fromArray<ResourceTypes>([
  new MetallicResource(0),
  new CrystallineResource(0),
  new LiquidResource(0),
]);
export const zeroEnergy: Energy<ResourceIdentifier> = new EnergyResource(0);

export class ResourceFactory {
  fromJSON({
    type,
    amount,
  }: ResourceJSON<ResourceIdentifier>): ComparableResource<ResourceIdentifier> {
    // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
    return resources[type] ? resources[type](amount) : resources.null(amount);
  }
}
