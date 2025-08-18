import {
  ResourceTypes,
  EnergyTypes,
  MetallicResource,
  CrystallineResource,
  // LiquidResource,
  zeroResources,
  // zeroEnergy,
} from './resources';
export type Resources = ResourceTypes | EnergyTypes;
import { Stock, ResourceCollection, type BuildingJSON } from '@phlame/engine';
import {
  Building,
  BuildingRequirement,
  // type BuildingIdentifier as BuildingID, type ProsumptionLookup, type RequirementLookup,
} from '@phlame/engine';

// export type BuildingIdentifier = BuildingID;
export type BuildingIdentifier = keyof typeof buildings;
export type BuildingType = keyof typeof buildings;

/* export const requirements: RequirementLookup<Resources, BuildingIdentifier> = {
  // Metallic mine
  1: new BuildingRequirement<Resources, BuildingIdentifier>(
    1,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(60),
      new CrystallineResource(15),
    ]),
    1.5,
    [],
  ),
  // Crystalline mine
  2: new BuildingRequirement<Resources, BuildingIdentifier>(
    2,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(48),
      new CrystallineResource(24),
    ]),
    1.6,
    [],
  ),
  // Liquid mine
  3: new BuildingRequirement<Resources, BuildingIdentifier>(
    3,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(225),
      new CrystallineResource(75),
    ]),
    1.5,
    [],
  ),
  // power
  4: new BuildingRequirement<Resources, BuildingIdentifier>(
    4,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(75),
      new CrystallineResource(30),
    ]),
    1.5,
    [],
  ),
  // power based on Liquid
  12: new BuildingRequirement<Resources, BuildingIdentifier>(
    12,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(48),
      new CrystallineResource(24),
    ]),
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
  14: new BuildingRequirement<Resources, BuildingIdentifier>(
    14, // robots factor=1/(1+level)
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(400),
      new CrystallineResource(120),
      new LiquidResource(200),
    ]),
    2,
    [],
  ), // FASTER
  15: new BuildingRequirement<Resources, BuildingIdentifier>(
    15, // nanites factor=1/2^level
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(1000000),
      new CrystallineResource(500000),
      new LiquidResource(100000),
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
  31: new BuildingRequirement<Resources, BuildingIdentifier>(
    31,
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(200),
      new CrystallineResource(400),
      new LiquidResource(200),
    ]),
    2,
    [],
  ),
  // tech (above 100)
  109: new BuildingRequirement<Resources, BuildingIdentifier>(
    113, // computer
    ResourceCollection.fromArray<Resources>([
      new CrystallineResource(800),
      new LiquidResource(400),
    ]),
    2,
    [
      {
        type: 31,
        level: 4,
      },
    ],
  ),
  113: new BuildingRequirement<Resources, BuildingIdentifier>(
    113, // energy
    ResourceCollection.fromArray<Resources>([
      new CrystallineResource(800),
      new LiquidResource(400),
    ]),
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

export const prosumption: ProsumptionLookup<Resources, BuildingIdentifier> = {
  0: {
    [ResourceTypes.Metallic]: (): number => {
      return 0;
    },
    [ResourceTypes.Crystalline]: (): number => {
      return 0;
    },
    [ResourceTypes.Liquid]: (): number => {
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
    [ResourceTypes.Metallic]: (lvl: number) => 30 * lvl * lvl ** 1.1,
    [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  },
  2: {
    [ResourceTypes.Crystalline]: (lvl: number) => 20 * lvl * lvl ** 1.1,
    [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  },
  3: {
    // TODO actually [ResourceTypes.Liquid]: (lvl, planet) => 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28),
    [ResourceTypes.Liquid]: (lvl: number): number => {
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
    [ResourceTypes.Liquid]: (lvl: number): number => {
      return -10 * lvl * lvl ** 1.1;
    },
    [EnergyTypes.Electricity]: (lvl: number): number => {
      return 50 * lvl * lvl ** 1.1;
    },
  },
};*/

export const buildings = {
  null: (level?: number, speed?: number) =>
    new Building(
      'null',
      {},
      {
        null: {
          [ResourceTypes.Metallic]: (): number => {
            return 0;
          },
          [ResourceTypes.Crystalline]: (): number => {
            return 0;
          },
          [ResourceTypes.Liquid]: (): number => {
            return 0;
          },
          [EnergyTypes.Electricity]: (): number => {
            return 0;
          },
        },
      },
      level,
      speed,
    ),
  'mine-metallic': (level?: number, speed?: number) =>
    new Building(
      'mine-metallic',
      {
        'mine-metallic': new BuildingRequirement<Resources, BuildingIdentifier>(
          'mine-metallic',
          ResourceCollection.fromArray<Resources>([
            new MetallicResource(60),
            new CrystallineResource(15),
          ]),
          1.5,
          [],
        ),
      },
      {
        'mine-metallic': {
          [ResourceTypes.Metallic]: (lvl: number) => 30 * lvl * lvl ** 1.1,
          [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
        },
      },
      level,
      speed,
    ),
  'mine-crystalline': (level?: number, speed?: number) =>
    new Building(
      'mine-crystalline',
      {
        'mine-crystalline': new BuildingRequirement<Resources, BuildingIdentifier>(
          'mine-crystalline',
          ResourceCollection.fromArray<Resources>([
            new MetallicResource(48),
            new CrystallineResource(24),
          ]),
          1.6,
          [],
        ),
      },
      {
        'mine-crystalline': {
          [ResourceTypes.Crystalline]: (lvl: number) => 20 * lvl * lvl ** 1.1,
          [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
        },
      },
      level,
      speed,
    ),
  'mine-liquid': (level?: number, speed?: number) =>
    new Building(
      'mine-liquid',
      {
        'mine-liquid': new BuildingRequirement<Resources, BuildingIdentifier>(
          'mine-liquid',
          ResourceCollection.fromArray<Resources>([
            new MetallicResource(225),
            new CrystallineResource(75),
          ]),
          1.5,
          [],
        ),
      },
      {
        'mine-liquid': {
          // TODO actually dependent on planet attribute maxTemperature: [ResourceTypes.Liquid]: (lvl, planet) => 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28),
          [ResourceTypes.Liquid]: (lvl: number): number => {
            return 10 * lvl * lvl ** 1.1;
          },
          [EnergyTypes.Electricity]: (lvl: number): number => {
            return -10 * lvl * lvl ** 1.1;
          },
        },
      },
      level,
      speed,
    ),
  'power-solar': (level?: number, speed?: number) =>
    new Building(
      'power-solar',
      {
        'power-solar': new BuildingRequirement<Resources, BuildingIdentifier>(
          'power-solar',
          ResourceCollection.fromArray<Resources>([
            new MetallicResource(75),
            new CrystallineResource(30),
          ]),
          1.5,
          [],
        ),
      },
      {
        'power-solar': {
          [EnergyTypes.Electricity]: (lvl: number): number => 20 * lvl * lvl ** 1.1,
        },
      },
      level,
      speed,
    ),
} as const;

// TODO time to get BuildingID type as keyof buildings
// - see if we need to refactor all the enums..
/*const b0 = new Building<Resources, BuildingID>(0, requirements, prosumption, 0, 0);
const b1 = new Building<Resources, BuildingID>(1, requirements, prosumption, 1, 100);
const b2 = new Building<Resources, BuildingID>(2, requirements, prosumption, 1, 100);
const b3 = new Building<Resources, BuildingID>(3, requirements, prosumption, 0, 0);
const b4 = new Building<Resources, BuildingID>(4, requirements, prosumption, 1, 100);

export const defaultBuildings: Building<Resources, BuildingIdentifier>[] = [b0, b1, b2, b3, b4];*/

export const defaultBuildings: Building<Resources, BuildingIdentifier>[] = [
  buildings['mine-metallic'](1),
  buildings['mine-crystalline'](1),
  buildings['mine-liquid'](0),
  buildings['power-solar'](1),
];
export const emptyStock = new Stock<ResourceTypes>(zeroResources);

export class BuildingFactory {
  fromJSON({
    type,
    level,
    speed,
  }: BuildingJSON<BuildingIdentifier>): Building<Resources, BuildingIdentifier> {
    // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
    return buildings[type] ? buildings[type](level, speed) : buildings.null(level, speed);
  }
}
