/* eslint max-classes-per-file: "off" */
import Resource from "./Resource";

export const TUMBLE_TYPE = "tumbles";
Resource.types.push(TUMBLE_TYPE);
export class TumbleResource extends Resource {
  constructor(amount: number) {
    super(TUMBLE_TYPE, amount);
  }
}

export const SALTY_TYPE = "salties";
Resource.types.push(SALTY_TYPE);
export class SaltyResource extends Resource {
  constructor(amount: number) {
    super(SALTY_TYPE, amount);
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
