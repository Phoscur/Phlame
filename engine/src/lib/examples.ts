import examples, {
  ResourceTypes,
  EnergyTypes,
  TumbleResource,
  SaltyResource,
  BlubbResource,
  phormulae as resourcePhormulae,
} from './resources/examples';
import { Stock, ResourceCollection } from './resources';
import { Phelopment, PhelopmentIdentifier as PhelopmentID } from './Phelopment';
import { type ProsumptionLookup, type RequirementLookup } from './Phormulae';
import { Phormula } from './Phormula';
import { PhelopmentRequirement } from './PhelopmentRequirement';
import { Economy } from './Economy';
import { Phlame } from './Phlame';
import { Empire } from './Empire';

export type Resources = ResourceTypes | EnergyTypes;

// TODO better phelopment type: const map

export const requirements: RequirementLookup<Resources, PhelopmentID> = {
  // tumble mine
  1: new PhelopmentRequirement<Resources, PhelopmentID>(
    1,
    ResourceCollection.fromArray<Resources>([new TumbleResource(60), new SaltyResource(15)]),
    1.5,
    [],
  ),
  // salty mine
  2: new PhelopmentRequirement<Resources, PhelopmentID>(
    2,
    ResourceCollection.fromArray<Resources>([new TumbleResource(48), new SaltyResource(24)]),
    1.6,
    [],
  ),
  // blubber mine
  3: new PhelopmentRequirement<Resources, PhelopmentID>(
    3,
    ResourceCollection.fromArray<Resources>([new TumbleResource(225), new SaltyResource(75)]),
    1.5,
    [],
  ),
  // power
  4: new PhelopmentRequirement<Resources, PhelopmentID>(
    4,
    ResourceCollection.fromArray<Resources>([new TumbleResource(75), new SaltyResource(30)]),
    1.5,
    [],
  ),
  // power based on blubber
  12: new PhelopmentRequirement<Resources, PhelopmentID>(
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
  // build phelopments faster! TODO we need to add the time reducing factors
  14: new PhelopmentRequirement<Resources, PhelopmentID>(
    14, // robots factor=1/(1+level)
    ResourceCollection.fromArray<Resources>([
      new TumbleResource(400),
      new SaltyResource(120),
      new BlubbResource(200),
    ]),
    2,
    [],
  ), // FASTER
  15: new PhelopmentRequirement<Resources, PhelopmentID>(
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
  31: new PhelopmentRequirement<Resources, PhelopmentID>(
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
  109: new PhelopmentRequirement<Resources, PhelopmentID>(
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
  113: new PhelopmentRequirement<Resources, PhelopmentID>(
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
  // TODO add the remaining phelopments and tech aswell as fleet (with ids above 200)
} as const;
export const prosumption: ProsumptionLookup<Resources, PhelopmentID> = {
  0: {
    [ResourceTypes.Tumble]: Phormula.zero(),
    [ResourceTypes.Salty]: Phormula.zero(),
    [ResourceTypes.Blubber]: Phormula.zero(),
    [EnergyTypes.Electricity]: Phormula.zero(),
    [EnergyTypes.Heat]: Phormula.zero(),
  },
  1: {
    [ResourceTypes.Tumble]: Phormula.polynomial(30),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  2: {
    [ResourceTypes.Salty]: Phormula.polynomial(20),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  3: {
    // TODO actually dependent on the planet's maxTemperature - a future Phormula kind:
    // 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28)
    [ResourceTypes.Blubber]: Phormula.polynomial(10),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  4: {
    [EnergyTypes.Electricity]: Phormula.polynomial(20),
  },
  12: {
    [ResourceTypes.Blubber]: Phormula.polynomial(-10),
    [EnergyTypes.Electricity]: Phormula.polynomial(50),
  },
} as const;

// The complete example rules: types + requirements + prosumption Phormulae -
// passed explicitly into every Economy (no global; ADR 0014 injection complete)
export const phormulae = resourcePhormulae
  .withRequirements(requirements)
  .withProsumptions(prosumption);
const b = new Phelopment<Resources, PhelopmentID>(12, 1, 100);
const bUpgraded = new Phelopment<Resources, PhelopmentID>(12, 2, 100);
const b0 = new Phelopment<Resources, PhelopmentID>(0, 1, 50); // 0 times 0,5 is still 0
const b3 = new Phelopment<Resources, PhelopmentID>(3, 1, 100);
const b1 = new Phelopment<Resources, PhelopmentID>(1, 2, 100);
const b2 = new Phelopment<Resources, PhelopmentID>(2, 1, 100);
const b4 = new Phelopment<Resources, PhelopmentID>(4, 1, 100);
export const phelopments: Phelopment<Resources, PhelopmentID>[] = [b, b3, b0, b2];
export const overconsumingPhelopments: Phelopment<Resources, PhelopmentID>[] = [b, b1, b2, b3, b0];
export const underBlubberPhelopments: Phelopment<Resources, PhelopmentID>[] = [
  bUpgraded,
  b1,
  b2,
  b3,
  b0,
  b4,
];
export const defaultPhelopments: Phelopment<Resources, PhelopmentID>[] = [b1.downgraded, b2, b4];
const { t3, s3, b15 } = examples;
export const resourceCollection = ResourceCollection.fromArray<ResourceTypes>([t3, s3, b15]);
export const emptyResourceCollection = ResourceCollection.fromArray<ResourceTypes>([
  t3.zero,
  s3.zero,
  b15.zero,
]);
export const stock = new Stock<Resources>(resourceCollection);
export const emptyStock = new Stock<Resources>(emptyResourceCollection);
export const economy = new Economy<Resources, PhelopmentID>('Eco', stock, defaultPhelopments, phormulae);
export const phlame = new Phlame<Resources, PhelopmentID>('Phlame', economy);
export const empire = new Empire<Resources, PhelopmentID>('Empire', [phlame]);
