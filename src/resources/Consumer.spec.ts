import { expect } from "chai";

import Consumer from "./Consumer";

describe("Consumer", () => {
  it("should be console printable", () => {
    const b = new Consumer("B");
    expect(b.toString()).to.eql("Consumer(B, 0, 1)");
  });

  it("should have resources", () => {
    const speed = 0.5;
    const level = 5;
    const building = new Consumer("Scraper", level, speed);
    expect(building.toString()).to.eql("Consumer(Scraper, 5, 0.5)");
    expect(building.upgraded.toString()).to.eql("Consumer(Scraper, 6, 0.5)");
    expect(building.downgraded.toString()).to.eql("Consumer(Scraper, 4, 0.5)");
    expect(building.at(1).toString()).to.eql("Consumer(Scraper, 5, 1)");
  });

  it("should ignore over- and underspeed", () => {
    const b = new Consumer("B", 1, -2);
    const b2 = new Consumer("B", 1, 2);
    expect(b.toString()).to.eql("Consumer(B, 1, 0)");
    expect(b2.toString()).to.eql("Consumer(B, 1, 1)");
  });

  it("should consume energy (and produce resources)", () => {
    const c = new Consumer("CoalPowerPlant", 1, 1);
    expect(c.toString()).to.eql("Consumer(CoalPowerPlant, 1, 1)");
  });
});
