/* eslint max-classes-per-file: "off", arrow-body-style: "off" */
import {
  BaseResources,
  Energy,
  Resource,
  ResourceCollection,
  ResourceProcess,
  ResourceProcessCollection,
} from ".";

export enum ResourceTypes {
  // ...BaseResources,
  Tumble = "tumbles",
  Salty = "salties",
  Blubber = "blubbs",
  Electricity = "energy",
  Heat = "heat",
}

export type Types = ResourceTypes | BaseResources;

// Add new resources to known resource types
const newResourceTypes: Types[] = [
  ResourceTypes.Tumble,
  ResourceTypes.Salty,
];
Resource.types.push(...newResourceTypes);

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

export class EnergyResource extends Energy<ResourceTypes.Electricity> {
  constructor(amount: number) {
    super(ResourceTypes.Electricity, amount);
  }
}
/**
 * Heat as another energy example type, yes!
 * Geoengineering allows to change a planets temperature for example, which has a huge impact on the ecology
 * The game physics of temperature could be similar to energy level
 */
export class HeatResource extends Energy<ResourceTypes.Heat> {
  constructor(amount: number) {
    super(ResourceTypes.Heat, amount);
  }
}

export type ResourceType = TumbleResource | SaltyResource | BaseResources;
export type EnergyType = EnergyResource;

const t0 = new TumbleResource(0);
const t1 = new TumbleResource(1);
const t3 = new TumbleResource(3);
const s3 = new SaltyResource(3);
const examples: {[name: string]: Resource<Types>} = {
  t0,
  t1,
  t3,
  t5: new TumbleResource(5),
  t8: new TumbleResource(8),
  s3,
  s6: new SaltyResource(6),
  s9: new SaltyResource(9),
};
export const resources: {[name: string]: ResourceCollection<Types>} = {
  t3s3: ResourceCollection.fromArray([t3, s3]),
};
const rt11 = new ResourceProcess(t1, 1);
const rt31 = new ResourceProcess(t3, 1);
const rs31 = new ResourceProcess(s3, 1);
export const process: {[name: string]: ResourceProcess<Types>} = {
  rt11,
  rt31,
  rs31,
};
export const processes: {[name: string]: ResourceProcessCollection<Types>} = {
  rt11s31: ResourceProcessCollection.fromArray([rt11, rs31]),
  rt31s31: ResourceProcessCollection.fromArray([rt31, rs31]),
};
export const energy: {[name: string]: Energy<Types>} = {
  em10: new EnergyResource(-10),
  e0: new EnergyResource(0),
  e10: new EnergyResource(10),
  e100: new EnergyResource(100),
  h0: new HeatResource(0),
  h10: new HeatResource(10),
};

export default examples;

export const production = {
  [ResourceTypes.Tumble]: (lvl: number) => 30 * lvl * lvl ** 1.1,
  [ResourceTypes.Salty]: (lvl: number) => 20 * lvl * lvl ** 1.1,
  [ResourceTypes.Electricity]: (lvl: number) => 10 * lvl * lvl ** 1.1,
};

export const consumption = {
  [ResourceTypes.Salty]: (lvl: number) => -10 * lvl * lvl ** 1.1,
  [ResourceTypes.Electricity]: (lvl: number) => -10 * lvl * lvl ** 1.1,
};
