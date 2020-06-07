/* eslint max-classes-per-file: "off" */
import Resource, { BaseResources } from "./Resource";
import Energy from "./Energy";

export enum ResourceTypes {
  // ...BaseResources,
  Tumble = "tumbles",
  Salty = "salties",
  Electricity = "energy",
  Battery = "batteries",
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

export class EnergyResource extends Energy<ResourceTypes.Electricity> {
  constructor(amount: number) {
    super(ResourceTypes.Electricity, amount);
  }
}
export class BatteryResource extends Energy<ResourceTypes.Battery> {
  constructor(amount: number) {
    super(ResourceTypes.Battery, amount);
  }
}

export type ResourceType = TumbleResource | SaltyResource | BaseResources;
export type EnergyType = EnergyResource;

const t0 = new TumbleResource(0);
const examples: {[name: string]: Resource<Types>} = {
  t0,
  t1: new TumbleResource(1),
  t3: new TumbleResource(3),
  t5: new TumbleResource(5),
  t8: new TumbleResource(8),
  s3: new SaltyResource(3),
  s6: new SaltyResource(6),
  s9: new SaltyResource(9),
};
export const energy: {[name: string]: Energy<Types>} = {
  e0: new EnergyResource(0),
  e10: new EnergyResource(10),
  e100: new EnergyResource(100),
  b0: new BatteryResource(0),
  b10: new BatteryResource(10),
};

export default examples;
