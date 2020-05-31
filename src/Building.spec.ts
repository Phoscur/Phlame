import { expect } from "chai";

import Building from "./Building";

describe("Building", () => {
  it("should be console printable", () => {
    const b = new Building("B");
    expect(b.toString()).to.eql("Building(B, 0, 1)");
  });

  it("should have resources and buildings", () => {
    const speed = 0.5;
    const level = 5;
    const building = new Building("Scraper", level, speed);
    expect(building.toString()).to.eql("Building(Scraper, 5, 0.5)");
    expect(building.upgraded.toString()).to.eql("Building(Scraper, 6, 0.5)");
    expect(building.downgraded.toString()).to.eql("Building(Scraper, 4, 0.5)");
    expect(building.at(1).toString()).to.eql("Building(Scraper, 5, 1)");
  });

  it("should ignore over- and underspeed", () => {
    const b = new Building("B", 1, -2);
    const b2 = new Building("B", 1, 2);
    expect(b.toString()).to.eql("Building(B, 1, 0)");
    expect(b2.toString()).to.eql("Building(B, 1, 1)");
  });
});
