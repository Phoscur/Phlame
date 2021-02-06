import examples, {
  ResourceTypes,
  EnergyTypes,
  TumbleResource,
  SaltyResource,
  BlubbResource,
} from "./resources/examples";
export type ResourceLike = ResourceTypes | EnergyTypes;
export type { ResourceTypes, EnergyTypes } from "./resources/examples";
import { Stock, ResourceCollection } from "./resources";
import Empire from "./Empire";
import Building, { BuildingIdentifier, ProsumptionLookup, RequirementLookup } from "./Building";
import BuildingRequirement from "./BuildingRequirement";

export const requirements: RequirementLookup<BuildingIdentifier, ResourceLike> = {
  // tumble mine
  1: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    1,
    ResourceCollection.fromArray<ResourceLike>([new TumbleResource(60), new SaltyResource(15)]),
    1.5,
    [],
  ),
  // salty mine
  2: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    2,
    ResourceCollection.fromArray<ResourceLike>([new TumbleResource(48), new SaltyResource(24)]),
    1.6,
    [],
  ),
  // blubber mine
  3: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    3,
    ResourceCollection.fromArray<ResourceLike>([new TumbleResource(225), new SaltyResource(75)]),
    1.5,
    [],
  ),
  // power
  4: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    4,
    ResourceCollection.fromArray<ResourceLike>([new TumbleResource(75), new SaltyResource(30)]),
    1.5,
    [],
  ),
  // power based on blubber
  12: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    12,
    ResourceCollection.fromArray<ResourceLike>([new TumbleResource(48), new SaltyResource(24)]),
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
  14: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    14, // robots factor=1/(1+level)
    ResourceCollection.fromArray<ResourceLike>([
      new TumbleResource(400),
      new SaltyResource(120),
      new BlubbResource(200),
    ]),
    2,
    [],
  ), // FASTER
  15: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    15, // nanites factor=1/2^level
    ResourceCollection.fromArray<ResourceLike>([
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
  31: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    31,
    ResourceCollection.fromArray<ResourceLike>([
      new TumbleResource(200),
      new SaltyResource(400),
      new BlubbResource(200),
    ]),
    2,
    [],
  ),
  // tech (above 100)
  109: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    113, // computer
    ResourceCollection.fromArray<ResourceLike>([new SaltyResource(800), new BlubbResource(400)]),
    2,
    [
      {
        type: 31,
        level: 4,
      },
    ],
  ),
  113: new BuildingRequirement<BuildingIdentifier, ResourceLike>(
    113, // energy
    ResourceCollection.fromArray<ResourceLike>([new SaltyResource(800), new BlubbResource(400)]),
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
export const prosumption: ProsumptionLookup<BuildingIdentifier, ResourceLike> = {
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
const b = new Building<BuildingIdentifier, ResourceLike>(12, requirements, prosumption, 1, 100);
const bUpgraded = new Building<BuildingIdentifier, ResourceLike>(
  12,
  requirements,
  prosumption,
  2,
  100,
);
const b0 = new Building<BuildingIdentifier, ResourceLike>(0, requirements, prosumption, 1, 50); // 0 times 0,5 is still 0
const b3 = new Building<BuildingIdentifier, ResourceLike>(3, requirements, prosumption, 1, 100);
const b1 = new Building<BuildingIdentifier, ResourceLike>(1, requirements, prosumption, 2, 100);
const b2 = new Building<BuildingIdentifier, ResourceLike>(2, requirements, prosumption, 1, 100);
const b4 = new Building<BuildingIdentifier, ResourceLike>(4, requirements, prosumption, 1, 100);
export const buildings: Building<BuildingIdentifier, ResourceLike>[] = [b, b3, b0, b2];
export const overconsumingBuildings: Building<BuildingIdentifier, ResourceLike>[] = [
  b,
  b1,
  b2,
  b3,
  b0,
];
export const underBlubberBuildings: Building<BuildingIdentifier, ResourceLike>[] = [
  bUpgraded,
  b1,
  b2,
  b3,
  b0,
  b4,
];
export const defaultBuildings: Building<BuildingIdentifier, ResourceLike>[] = [
  b1.downgraded,
  b2,
  b4,
];
const { t3, s3, b15 } = examples;
export const resourceCollection = ResourceCollection.fromArray<ResourceTypes>([t3, s3, b15]);
export const emptyResourceCollection = ResourceCollection.fromArray<ResourceTypes>([
  t3.zero,
  s3.zero,
  b15.zero,
]);
export const stock = new Stock<ResourceTypes>(resourceCollection);
export const emptyStock = new Stock<ResourceTypes>(emptyResourceCollection);

const empire = new Empire("Phlameland", stock, buildings);

export default empire;
