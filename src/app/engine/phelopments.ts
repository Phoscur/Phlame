import {
  ResourceTypes,
  EnergyTypes,
  MetallicResource,
  CrystallineResource,
  zeroResources,
  resourcePhormulae,
} from './resources';
export type Resources = ResourceTypes | EnergyTypes;
import {
  Phelopment,
  PhelopmentRequirement,
  Phormula,
  ResourceCollection,
  Stock,
  type PhelopmentJSON,
  type ProsumptionLookup,
  type RequirementLookup,
} from '@phlame/engine';

export type PhelopmentIdentifier = keyof typeof phelopments;
export type PhelopmentType = keyof typeof phelopments;

export const requirements: RequirementLookup<Resources, PhelopmentIdentifier> = {
  'mine-metallic': new PhelopmentRequirement<Resources, PhelopmentIdentifier>(
    'mine-metallic',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(60),
      new CrystallineResource(15),
    ]),
    1.5,
    [],
  ),
  'mine-crystalline': new PhelopmentRequirement<Resources, PhelopmentIdentifier>(
    'mine-crystalline',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(48),
      new CrystallineResource(24),
    ]),
    1.6,
    [],
  ),
  'mine-liquid': new PhelopmentRequirement<Resources, PhelopmentIdentifier>(
    'mine-liquid',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(225),
      new CrystallineResource(75),
    ]),
    1.5,
    [],
  ),
  'power-solar': new PhelopmentRequirement<Resources, PhelopmentIdentifier>(
    'power-solar',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(75),
      new CrystallineResource(30),
    ]),
    1.5,
    [],
  ),
};

export const prosumptions: ProsumptionLookup<Resources, PhelopmentIdentifier> = {
  null: {},
  'mine-metallic': {
    [ResourceTypes.Metallic]: Phormula.polynomial(30),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  'mine-crystalline': {
    [ResourceTypes.Crystalline]: Phormula.polynomial(20),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  'mine-liquid': {
    // TODO actually dependent on planet attribute maxTemperature - a future Phormula kind:
    // 10 * lvl * lvl ** 1.1 * (-0.002 * planet.maxTemperature + 1.28)
    [ResourceTypes.Liquid]: Phormula.polynomial(10),
    [EnergyTypes.Electricity]: Phormula.polynomial(-10),
  },
  'power-solar': {
    [EnergyTypes.Electricity]: Phormula.polynomial(20),
  },
};

/**
 * The game's complete Phormulae (ADR 0014/0015): types + requirements + prosumptions.
 * Passed explicitly into every Economy (EngineFactory, services) - no global (ADR 0014).
 */
export const phormulae = resourcePhormulae
  .withRequirements(requirements)
  .withProsumptions(prosumptions);

export const phelopments = {
  null: (level?: number, speed?: number) => new Phelopment('null', level, speed),
  'mine-metallic': (level?: number, speed?: number) =>
    new Phelopment('mine-metallic', level, speed),
  'mine-crystalline': (level?: number, speed?: number) =>
    new Phelopment('mine-crystalline', level, speed),
  'mine-liquid': (level?: number, speed?: number) => new Phelopment('mine-liquid', level, speed),
  'power-solar': (level?: number, speed?: number) => new Phelopment('power-solar', level, speed),
} as const;

// TODO time to get PhelopmentID type as keyof phelopments
// - see if we need to refactor all the enums..

export const defaultPhelopments: Phelopment<Resources, PhelopmentIdentifier>[] = [
  phelopments['mine-metallic'](1),
  phelopments['mine-crystalline'](1),
  phelopments['mine-liquid'](0),
  phelopments['power-solar'](1),
];
export const emptyStock = new Stock<ResourceTypes>(zeroResources);

export class PhelopmentFactory {
  fromJSON({
    type,
    level,
    speed,
  }: PhelopmentJSON<PhelopmentIdentifier>): Phelopment<Resources, PhelopmentIdentifier> {
    return phelopments[type] ? phelopments[type](level, speed) : phelopments.null(level, speed);
  }
}

/*
 * M0 reference — the full intended phelopment + tech tree (numbers from the UGamela era).
 * The live definitions above cover the first four phelopments; this block is the target to
 * grow into: proper string names still missing (numeric ids below), tech dependencies,
 * special phelopments (faster phelopment), and conversion of the formulas to Phormula
 * descriptors (ADR 0015). See PLAN.md M0/M2. Fusion (12) needs mine-liquid L5 + energy-tech
 * L3; nanites (15) need robots (14) L10 + tech 108 L10; techs (109 computer, 113 energy)
 * live on the Empire per "everything is a Phlame" (ADR 0012).
 *
 * export const requirements: RequirementLookup<Resources, PhelopmentIdentifier> = {
 *   // Metallic mine
 *   1: new PhelopmentRequirement(1, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(60), new CrystallineResource(15)]), 1.5, []),
 *   // Crystalline mine
 *   2: new PhelopmentRequirement(2, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(48), new CrystallineResource(24)]), 1.6, []),
 *   // Liquid mine
 *   3: new PhelopmentRequirement(3, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(225), new CrystallineResource(75)]), 1.5, []),
 *   // power (solar)
 *   4: new PhelopmentRequirement(4, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(75), new CrystallineResource(30)]), 1.5, []),
 *   // power based on Liquid (fusion)
 *   12: new PhelopmentRequirement(12, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(48), new CrystallineResource(24)]), 1.8,
 *     [{ type: 3, level: 5 }, { type: 113, level: 3 }]),
 *   // build phelopments faster! TODO time-reducing factors — robots factor=1/(1+level)
 *   14: new PhelopmentRequirement(14, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(400), new CrystallineResource(120), new LiquidResource(200)]), 2, []),
 *   // nanites factor=1/2^level
 *   15: new PhelopmentRequirement(15, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(1000000), new CrystallineResource(500000), new LiquidResource(100000)]),
 *     2, [{ type: 14, level: 10 }, { type: 108, level: 10 }]),
 *   // lab
 *   31: new PhelopmentRequirement(31, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(200), new CrystallineResource(400), new LiquidResource(200)]), 2, []),
 *   // tech (above 100) — computer
 *   109: new PhelopmentRequirement(113, ResourceCollection.fromArray<Resources>([
 *     new CrystallineResource(800), new LiquidResource(400)]), 2, [{ type: 31, level: 4 }]),
 *   // energy tech
 *   113: new PhelopmentRequirement(113, ResourceCollection.fromArray<Resources>([
 *     new CrystallineResource(800), new LiquidResource(400)]), 2, [{ type: 31, level: 1 }]),
 *   // TODO remaining phelopments, tech and fleet (ids above 200)
 * };
 *
 * // prosumption per level (now Phormula.polynomial(coefficient), see live prosumptions above)
 * // 1 metallic mine: Metallic +30, Electricity -10
 * // 2 crystalline mine: Crystalline +20, Electricity -10
 * // 3 liquid mine: Liquid +10 (TODO * (-0.002*maxTemperature + 1.28)), Electricity -10
 * // 4 solar power: Electricity +20
 * // 12 fusion: Liquid -10, Electricity +50
 */
