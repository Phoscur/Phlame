/* eslint-disable max-classes-per-file, arrow-body-style */
import {
  BaseResources,
  Energy,
  Resource,
  ResourceCollection,
  ResourceProcess,
  ResourceProcessCollection,
} from ".";

// Let's invent some example replacement resource and energy types
export enum ResourceTypes {
  // ...BaseResources,
  Tumble = "tumbles",
  Salty = "salties",
  Blubber = "blubbs",
}

export enum EnergyTypes {
  Electricity = "energy",
  Heat = "heat",
}

export type Types = ResourceTypes | EnergyTypes | BaseResources;

// Add new resources to known resource types
const newResourceTypes: Types[] = [
  ResourceTypes.Tumble,
  ResourceTypes.Salty,
  ResourceTypes.Blubber,
];
const newEnergyTypes: Types[] = [EnergyTypes.Electricity, EnergyTypes.Heat];
Resource.types.push(...newResourceTypes);
Energy.types.push(...newEnergyTypes);

export class TumbleResource extends Resource<ResourceTypes.Tumble> {
  constructor(amount: number) {
    super(ResourceTypes.Tumble, amount);
  }
}

export class SaltyResource extends Resource<ResourceTypes.Salty> {
  constructor(amount: number) {
    super(ResourceTypes.Salty, amount);
  }
}
export class BlubbResource extends Resource<ResourceTypes.Blubber> {
  constructor(amount: number) {
    super(ResourceTypes.Blubber, amount);
  }
}

export class EnergyResource extends Energy<EnergyTypes.Electricity> {
  constructor(amount: number) {
    super(EnergyTypes.Electricity, amount);
  }
}
/**
 * Heat as another energy example type, yes!
 * Geoengineering allows to change a planets temperature for example, which has a huge impact on the ecology
 * The game physics of temperature could be similar to energy level
 */
export class HeatResource extends Energy<EnergyTypes.Heat> {
  constructor(amount: number) {
    super(EnergyTypes.Heat, amount);
  }
}

export type ResourceType = TumbleResource | SaltyResource | BaseResources;
export type EnergyType = EnergyResource;

const t0 = new TumbleResource(0);
const t1 = new TumbleResource(1);
const t3 = new TumbleResource(3);
const s0 = new SaltyResource(0);
const s3 = new SaltyResource(3);
const b1 = new BlubbResource(1);
const examples: { [name: string]: Resource<Types> } = {
  t0,
  t1,
  t3,
  t5: new TumbleResource(5),
  t6: new TumbleResource(6),
  t8: new TumbleResource(8),
  s0,
  s3,
  s6: new SaltyResource(6),
  s9: new SaltyResource(9),
  s10: new SaltyResource(10),
  b1,
  b15: new BlubbResource(15),
};

export default examples;

export const resources: { [name: string]: ResourceCollection<Types> } = {
  t3s3: ResourceCollection.fromArray([t3, s3]),
};
const e0 = new EnergyResource(0);
export const energy: { [name: string]: Energy<Types> } = {
  em10: new EnergyResource(-10),
  e0,
  e10: new EnergyResource(10),
  e100: new EnergyResource(100),
  eInf: e0.infinite,
  h0: new HeatResource(0),
  h10: new HeatResource(10),
};

export const production = {
  [ResourceTypes.Tumble]: (lvl: number) => 30 * lvl * lvl ** 1.1,
  [ResourceTypes.Salty]: (lvl: number) => 20 * lvl * lvl ** 1.1,
  [EnergyTypes.Electricity]: (lvl: number) => 50 * lvl * lvl ** 1.1,
};

export const consumption = {
  [ResourceTypes.Salty]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  [EnergyTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
};

const rt11 = new ResourceProcess(t1, 1);
const rt31 = new ResourceProcess(t3, 1);
const rs31 = new ResourceProcess(s3, 1);
const rb11 = new ResourceProcess(b1, 1);

const ps1 = new ResourceProcess(
  new Resource(ResourceTypes.Salty, production[ResourceTypes.Salty](1)),
  1,
);
const pe1 = new ResourceProcess(
  e0, // or energy.eInf?,
  production[EnergyTypes.Electricity](1),
);
const pt1 = new ResourceProcess(t0, production[ResourceTypes.Tumble](1));
const saltyConsumption10 = new SaltyResource(-consumption[ResourceTypes.Salty](1));
const cs1 = new ResourceProcess(saltyConsumption10, -1);
const ce1 = new ResourceProcess(e0, consumption[EnergyTypes.Electricity](1));

export const process: { [name: string]: ResourceProcess<Types> } = {
  rt11,
  rt31,
  rs31,
  rb11,
  pt1,
  ps1,
  pe1,
  cs1,
  ce1,
};

// salty up, energy up, salty down
const proRes = [ps1, pe1, cs1];

export const processes: { [name: string]: ResourceProcessCollection<Types> } = {
  rt11s31: ResourceProcessCollection.fromArray([rt11, rs31]),
  rt31s31: ResourceProcessCollection.fromArray([rt31, rs31]),
  rt31s31b11: ResourceProcessCollection.fromArray([rt31, rs31, rb11]),
  tumbles: ResourceProcessCollection.fromArray<Types>([ce1, pt1]),
  energy: ResourceProcessCollection.fromArray<Types>([pe1]),
  prosumption: ResourceProcessCollection.fromArray<Types>(proRes),
};
