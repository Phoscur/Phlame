import { expect } from "chai";

import { stock, requirements, prosumption } from "./examples";
import Building from "./Building";

describe("Building", () => {
  it("should be console printable", () => {
    const b = new Building("B", requirements, prosumption);
    expect(b.toString()).to.eql("Building(B, 0, 100%)");
  });

  it("should have resources and buildings", () => {
    const speed = 50;
    const level = 5;
    const building = new Building("Scraper", requirements, prosumption, level, speed);
    expect(building.toString()).to.eql("Building(Scraper, 5, 50%)");
    expect(building.upgraded.toString()).to.eql("Building(Scraper, 6, 50%)");
    expect(building.downgraded.toString()).to.eql("Building(Scraper, 4, 50%)");
    expect(building.at(100).toString()).to.eql("Building(Scraper, 5, 100%)");
  });

  it("should be a prosumer", () => {
    const b = new Building(12, requirements, prosumption, 1, 0);
    expect(b.prosumes(stock).toString()).to.eql(
      "Prosumer(12, 0%, ResourceProcessCollection[15blubbs-10, 0energy+50])",
    );
  });

  it("should ignore over- and underspeed", () => {
    const b = new Building("B", requirements, prosumption, 1, -200);
    const b2 = new Building("B", requirements, prosumption, 1, 200);
    expect(b.toString()).to.eql("Building(B, 1, 0%)");
    expect(b2.toString()).to.eql("Building(B, 1, 100%)");
  });
});
