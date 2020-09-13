import { expect } from "chai";

import { resourceCollection, requirements, prosumption } from "./examples";
import Building from "./Building";


describe("Building", () => {
  it("should be console printable", () => {
    const b = new Building("B", requirements, prosumption);
    expect(b.toString()).to.eql("Building(B, 0, 1)");
  });

  it("should have resources and buildings", () => {
    const speed = 0.5;
    const level = 5;
    const building = new Building("Scraper", requirements, prosumption, level, speed);
    expect(building.toString()).to.eql("Building(Scraper, 5, 0.5)");
    expect(building.upgraded.toString()).to.eql("Building(Scraper, 6, 0.5)");
    expect(building.downgraded.toString()).to.eql("Building(Scraper, 4, 0.5)");
    expect(building.at(1).toString()).to.eql("Building(Scraper, 5, 1)");
  });

  it("should be a prosumer", () => {
    const b = new Building(12, requirements, prosumption, 1, -2);
    expect(b.prosumes(resourceCollection).toString()).to.eql("Prosumer(12, 1)");
  });

  it("should ignore over- and underspeed", () => {
    const b = new Building("B", requirements, prosumption, 1, -2);
    const b2 = new Building("B", requirements, prosumption, 1, 2);
    expect(b.toString()).to.eql("Building(B, 1, 0)");
    expect(b2.toString()).to.eql("Building(B, 1, 1)");
  });
});
