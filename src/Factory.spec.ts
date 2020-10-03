import { expect } from "chai";

import { stock, buildings } from "./examples";
import Factory from "./Factory";

describe("Factory Entity", () => {
  it("should be console printable", () => {
    const factory = new Factory("Console", stock, buildings);
    expect(factory.toString()).to.eql(
      "Console (Processing energy&resources: "
      + "0 energy, "
      + "3tumbles(0, Infinity): 0, "
      + "3salties(0, Infinity): 0, "
      + "15blubbs(0, Infinity): -10"
      + ") ["
      + "Building(12, 1, 100%), "
      + "Building(0, 1, 0%)"
      + "]",
    );
  });

  it("should have resources and buildings", () => {
    const factory = new Factory("Factory", stock, buildings);
    // expect(factory.resources.energies).to.eql([]);

    // TODO - 10energy Prosumer(A, 1, 1) 89/112 or even -58/112
    expect(factory.toString()).to.eql(
      "Factory (Processing energy&resources: "
      + "0 energy, "
      + "3tumbles(0, Infinity): 0, "
      + "3salties(0, Infinity): 0, "
      + "15blubbs(0, Infinity): -10"
      + ") ["
      + "Building(12, 1, 100%), "
      + "Building(0, 1, 0%)"
      + "]",
    );
    // expect(factory.toString()).to.eql("Factory (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) []");
  });
});
