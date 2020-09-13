import { expect } from "chai";

import examples, { Types } from "./resources/examples";
import { EnergyCalculation, Stock, ResourceCollection } from "./resources";
import Building from "./Building";
import Factory from "./Factory";

describe("Factory Entity", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const resources = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const factory = new Factory("Factory", resources);
    // TODO - 10energy Prosumer(A, 1, 1) 89/112 or even -58/112
    expect(factory.toString()).to.eql("Factory (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) []");
  });

  it("should have resources and buildings", () => {
    const { t3, s3 } = examples;
    const buildings: Building[] = [];
    const resources = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const factory = new Factory("AllFresh", resources, buildings);
    expect(factory.toString()).to.eql("AllFresh (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) []");
  });
});
