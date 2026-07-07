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
  Building,
  BuildingRequirement,
  Phormula,
  Phormulae,
  ResourceCollection,
  Stock,
  type BuildingJSON,
  type ProsumptionLookup,
  type RequirementLookup,
} from '@phlame/engine';

export type BuildingIdentifier = keyof typeof buildings;
export type BuildingType = keyof typeof buildings;

export const requirements: RequirementLookup<Resources, BuildingIdentifier> = {
  'mine-metallic': new BuildingRequirement<Resources, BuildingIdentifier>(
    'mine-metallic',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(60),
      new CrystallineResource(15),
    ]),
    1.5,
    [],
  ),
  'mine-crystalline': new BuildingRequirement<Resources, BuildingIdentifier>(
    'mine-crystalline',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(48),
      new CrystallineResource(24),
    ]),
    1.6,
    [],
  ),
  'mine-liquid': new BuildingRequirement<Resources, BuildingIdentifier>(
    'mine-liquid',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(225),
      new CrystallineResource(75),
    ]),
    1.5,
    [],
  ),
  'power-solar': new BuildingRequirement<Resources, BuildingIdentifier>(
    'power-solar',
    ResourceCollection.fromArray<Resources>([
      new MetallicResource(75),
      new CrystallineResource(30),
    ]),
    1.5,
    [],
  ),
};

export const prosumptions: ProsumptionLookup<Resources, BuildingIdentifier> = {
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
 * The game's complete Phormulae (ADR 0014/0015): types + requirements + prosumptions;
 * activated as the current rules on import (until injection replaces `Phormulae.current`)
 */
export const phormulae = resourcePhormulae
  .withRequirements(requirements)
  .withProsumptions(prosumptions);
Phormulae.use(phormulae);

export const buildings = {
  null: (level?: number, speed?: number) => new Building('null', level, speed),
  'mine-metallic': (level?: number, speed?: number) =>
    new Building('mine-metallic', level, speed),
  'mine-crystalline': (level?: number, speed?: number) =>
    new Building('mine-crystalline', level, speed),
  'mine-liquid': (level?: number, speed?: number) => new Building('mine-liquid', level, speed),
  'power-solar': (level?: number, speed?: number) => new Building('power-solar', level, speed),
} as const;

// TODO time to get BuildingID type as keyof buildings
// - see if we need to refactor all the enums..

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

/*
 * M0 reference — the full intended building + tech tree (numbers from the UGamela era).
 * The live definitions above cover the first four buildings; this block is the target to
 * grow into: proper string names still missing (numeric ids below), tech dependencies,
 * special buildings (faster building), and conversion of the formulas to Phormula
 * descriptors (ADR 0015). See PLAN.md M0/M2. Fusion (12) needs mine-liquid L5 + energy-tech
 * L3; nanites (15) need robots (14) L10 + tech 108 L10; techs (109 computer, 113 energy)
 * live on the Empire per "everything is a Phlame" (ADR 0012).
 *
 * export const requirements: RequirementLookup<Resources, BuildingIdentifier> = {
 *   // Metallic mine
 *   1: new BuildingRequirement(1, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(60), new CrystallineResource(15)]), 1.5, []),
 *   // Crystalline mine
 *   2: new BuildingRequirement(2, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(48), new CrystallineResource(24)]), 1.6, []),
 *   // Liquid mine
 *   3: new BuildingRequirement(3, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(225), new CrystallineResource(75)]), 1.5, []),
 *   // power (solar)
 *   4: new BuildingRequirement(4, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(75), new CrystallineResource(30)]), 1.5, []),
 *   // power based on Liquid (fusion)
 *   12: new BuildingRequirement(12, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(48), new CrystallineResource(24)]), 1.8,
 *     [{ type: 3, level: 5 }, { type: 113, level: 3 }]),
 *   // build buildings faster! TODO time-reducing factors — robots factor=1/(1+level)
 *   14: new BuildingRequirement(14, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(400), new CrystallineResource(120), new LiquidResource(200)]), 2, []),
 *   // nanites factor=1/2^level
 *   15: new BuildingRequirement(15, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(1000000), new CrystallineResource(500000), new LiquidResource(100000)]),
 *     2, [{ type: 14, level: 10 }, { type: 108, level: 10 }]),
 *   // lab
 *   31: new BuildingRequirement(31, ResourceCollection.fromArray<Resources>([
 *     new MetallicResource(200), new CrystallineResource(400), new LiquidResource(200)]), 2, []),
 *   // tech (above 100) — computer
 *   109: new BuildingRequirement(113, ResourceCollection.fromArray<Resources>([
 *     new CrystallineResource(800), new LiquidResource(400)]), 2, [{ type: 31, level: 4 }]),
 *   // energy tech
 *   113: new BuildingRequirement(113, ResourceCollection.fromArray<Resources>([
 *     new CrystallineResource(800), new LiquidResource(400)]), 2, [{ type: 31, level: 1 }]),
 *   // TODO remaining buildings, tech and fleet (ids above 200)
 * };
 *
 * // prosumption per level (now Phormula.polynomial(coefficient), see live prosumptions above)
 * // 1 metallic mine: Metallic +30, Electricity -10
 * // 2 crystalline mine: Crystalline +20, Electricity -10
 * // 3 liquid mine: Liquid +10 (TODO * (-0.002*maxTemperature + 1.28)), Electricity -10
 * // 4 solar power: Electricity +20
 * // 12 fusion: Liquid -10, Electricity +50
 */
