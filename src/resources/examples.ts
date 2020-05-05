/* eslint max-classes-per-file: "off" */
import Resource from "./Resource";

export enum ResourceTypes {
  Tumble = "tumbles",
  Salty = "salties",
}
type Tumble = ResourceTypes.Tumble;
type Salty = ResourceTypes.Salty;
export type ResourceType = Tumble | Salty;
// Add new resources to known resource types
Resource.types.push(ResourceTypes.Tumble);
Resource.types.push(ResourceTypes.Salty);

export class TumbleResource extends Resource<Tumble> {
  constructor(amount: number) {
    super(ResourceTypes.Tumble, amount);
  }
}

export class SaltyResource extends Resource<Salty> {
  constructor(amount: number) {
    super(ResourceTypes.Salty, amount);
  }
}

export default {
  t0: new TumbleResource(0),
  t1: new TumbleResource(1),
  t3: new TumbleResource(3),
  t5: new TumbleResource(5),
  t8: new TumbleResource(8),
  s3: new SaltyResource(3),
  s6: new SaltyResource(6),
  s9: new SaltyResource(9),
};
