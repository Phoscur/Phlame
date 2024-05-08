import examples, {
  ResourceTypes,
  EnergyTypes,
  TumbleResource,
  SaltyResource,
  BlubbResource,
} from './resources/examples';
import { Stock, ResourceCollection } from './resources';
import {
  Building,
  BuildingIdentifier as BuildingID,
  ProsumptionLookup,
  RequirementLookup,
} from './Building';
import { BuildingRequirement } from './BuildingRequirement';
import { Economy } from './Economy';
import { Phlame } from './Phlame';
import { Empire } from './Empire';

export type Resources = ResourceTypes | EnergyTypes;

export const requirements: RequirementLookup<Resources, BuildingID> = {
  // tumble mine
  1: new BuildingRequirement<Resources, BuildingID>(
    1,
    ResourceCollection.fromArray<Resources>([new TumbleResource(60), new SaltyResource(15)]),
    1.5,
    [],
  ),
  // salty mine
  2: new BuildingRequirement<Resources, BuildingID>(
    2,
    ResourceCollection.fromArray<Resources>([new TumbleResource(48), new SaltyResource(24)]),
    1.6,
    [],
  ),
  // blubber mine
  3: new BuildingRequirement<Resources, BuildingID>(
    3,
    ResourceCollection.fromArray<Resources>([new TumbleResource(225), new SaltyResource(75)]),
    1.5,
    [],
  ),
  // power
  4: new BuildingRequirement<Resources, BuildingID>(
    4,
    ResourceCollection.fromArray<Resources>([new TumbleResource(75), new SaltyResource(30)]),
    1.5,
    [],
  ),
  // power based on blubber
  12: new BuildingRequirement<Resources, BuildingID>(
    12,
    ResourceCollection.fromArray<Resources>([new TumbleResource(48), new SaltyResource(24)]),
    1.8,
    [
      {
        type: 3,
        level: 5,
      },
      {
        type: 113,
        level: 3,
      },
    ],
  ),
  // build buildings faster! TODO we need to add the time reducing factors
  14: new BuildingRequirement<Resources, BuildingID>(
    14, // robots factor=1/(1+level)
    ResourceCollection.fromArray<Resources>([
      new TumbleResource(400),
      new SaltyResource(120),
      new BlubbResource(200),
    ]),
    2,
    [],
  ), // FASTER
  15: new BuildingRequirement<Resources, BuildingID>(
    15, // nanites factor=1/2^level
    ResourceCollection.fromArray<Resources>([
      new TumbleResource(1000000),
      new SaltyResource(500000),
      new BlubbResource(100000),
    ]),
    2,
    [
      {
        type: 14,
        level: 10,
      },
      {
        type: 108,
        level: 10,
      },
    ],
  ),
  // lab
  31: new BuildingRequirement<Resources, BuildingID>(
    31,
    ResourceCollection.fromArray<Resources>([
      new TumbleResource(200),
      new SaltyResource(400),
      new BlubbResource(200),
    ]),
    2,
    [],
  ),
  // tech (above 100)
  109: new BuildingRequirement<Resources, BuildingID>(
    113, // computer
    ResourceCollection.fromArray<Resources>([new SaltyResource(800), new BlubbResource(400)]),
    2,
    [
      {
        type: 31,
        level: 4,
      },
    ],
  ),
  113: new BuildingRequirement<Resources, BuildingID>(
    113, // energy
    ResourceCollection.fromArray<Resources>([new SaltyResource(800), new BlubbResource(400)]),
    2,
    [
      {
        type: 31,
        level: 1,
      },
    ],
  ),
  // TODO add the remaining buildings and tech aswell as fleet (with ids above 200)
};
export const prosumption: ProsumptionLookup<Resources, BuildingID> = {
  0: {
    [ResourceTypes.Tumble]: (): number => {
      return 0;
    },
    [ResourceTypes.Salty]: (): number => {
      return 0;
    },
    [ResourceTypes.Blubber]: (): number => {
      return 0;
    },
    [EnergyTypes.Electricity]: (): number => {
      return 0;
    },
    [EnergyTypes.Heat]: (): number => {
      return 0;
    },
  },
  1: {
    [ResourceTypes.Tumble]: (lvl: number) => 30 * lvl * lvl ** 1.1,
    [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  },
  2: {
    [ResourceTypes.Salty]: (lvl: number) => 20 * lvl * lvl ** 1.1,
    [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  },
  3: {
    // TODO actually [ResourceTypes.Blubber]: (lvl, planet) => 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28),
    [ResourceTypes.Blubber]: (lvl: number): number => {
      return 10 * lvl * lvl ** 1.1;
    },
    [EnergyTypes.Electricity]: (lvl: number): number => {
      return -10 * lvl * lvl ** 1.1;
    },
  },
  4: {
    [EnergyTypes.Electricity]: (lvl: number): number => 20 * lvl * lvl ** 1.1,
  },
  12: {
    [ResourceTypes.Blubber]: (lvl: number): number => {
      return -10 * lvl * lvl ** 1.1;
    },
    [EnergyTypes.Electricity]: (lvl: number): number => {
      return 50 * lvl * lvl ** 1.1;
    },
  },
};
const b = new Building<Resources, BuildingID>(12, requirements, prosumption, 1, 100);
const bUpgraded = new Building<Resources, BuildingID>(12, requirements, prosumption, 2, 100);
const b0 = new Building(0, requirements, prosumption, 1, 50); // 0 times 0,5 is still 0
const b3 = new Building<Resources, BuildingID>(3, requirements, prosumption, 1, 100);
const b1 = new Building<Resources, BuildingID>(1, requirements, prosumption, 2, 100);
const b2 = new Building<Resources, BuildingID>(2, requirements, prosumption, 1, 100);
const b4 = new Building<Resources, BuildingID>(4, requirements, prosumption, 1, 100);
export const buildings: Building<Resources, BuildingID>[] = [b, b3, b0, b2];
export const overconsumingBuildings: Building<Resources, BuildingID>[] = [b, b1, b2, b3, b0];
export const underBlubberBuildings: Building<Resources, BuildingID>[] = [
  bUpgraded,
  b1,
  b2,
  b3,
  b0,
  b4,
];
export const defaultBuildings: Building<Resources, BuildingID>[] = [b1.downgraded, b2, b4];
const { t3, s3, b15 } = examples;
export const resourceCollection = ResourceCollection.fromArray<ResourceTypes>([t3, s3, b15]);
export const emptyResourceCollection = ResourceCollection.fromArray<ResourceTypes>([
  t3.zero,
  s3.zero,
  b15.zero,
]);
export const stock = new Stock<Resources>(resourceCollection);
export const emptyStock = new Stock<Resources>(emptyResourceCollection);
export const economy = new Economy<Resources, BuildingID>('Eco', stock, defaultBuildings);
export const phlame = new Phlame<Resources, BuildingID>('Phlame', economy);
export const empire = new Empire<Resources, BuildingID>('Empire', [phlame]);
