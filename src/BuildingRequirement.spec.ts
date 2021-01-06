import { expect } from "chai";

import examples, { Types } from "./resources/examples";
import BuildingRequirement from "./BuildingRequirement";
import ResourceCollection from "./resources/ResourceCollection";
import Stock from "./resources/Stock";
import Factory from "./Factory";

describe("BuildingRequirement", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    // const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    // const factory = new Factory("Fact1", stock);
    const b = new BuildingRequirement("B", ress, 1.5, []);
    expect(b.toString()).to.eql("BuildingRequirement(B)");
  });

  it("should have resources and buildings", () => {
    const { t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const factory = new Factory("Fact2", stock);
    const type = "B";
    const level = 1;
    const b = new BuildingRequirement(type, ress, 1, []);

    expect(b.toString()).to.eql("BuildingRequirement(B)");
    expect(b.matches(type)).to.eql(true);
    expect(b.isSatisfied(level, factory.resources)).to.eql(true);
    expect(b.isSatisfiedForDowngrade(level, factory.resources)).to.eql(true);
    expect(b.getUpgradeCost(level).toString()).to.eql("ResourceCollection[3tumbles, 3salties]");
    expect(b.getDowngradeCost(level).toString()).to.eql("ResourceCollection[1tumbles, 1salties]");
  });

  it("should not have enough resources", () => {
    const { t0, t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    const stock0 = new Stock<Types>(ResourceCollection.fromArray([t0, s3]));
    const factory = new Factory("Fact3", stock0);
    const level = 1;
    const b = new BuildingRequirement("B", ress, 2, []);

    expect(b.toString()).to.eql("BuildingRequirement(B)");
    expect(b.isSatisfied(level, factory.resources)).to.eql(false);
  });
});
