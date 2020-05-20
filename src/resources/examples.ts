/* eslint max-classes-per-file: "off" */
import Resource, { BaseResources } from "./Resource";

export enum ResourceTypes {
  // ...BaseResources,
  Tumble = "tumbles",
  Salty = "salties",
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

export type ResourceType = TumbleResource | SaltyResource | BaseResources;

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

export default examples;
