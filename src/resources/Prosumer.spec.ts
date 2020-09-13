import { expect } from "chai";

import { resources, processes } from "./examples";
import Prosumer from "./Prosumer";

describe("Prosumer ValueObject", () => {
  it("should be console printable", () => {
    const b = new Prosumer("B", processes.rt1s3);
    expect(b.toString()).to.eql("Prosumer(B, 1)");
  });

  it("should have resources", () => {
    const speed = 0.5;
    const building = new Prosumer("Scraper", processes.rt1s3, speed);
    expect(building.toString()).to.eql("Prosumer(Scraper, 0.5)");
    expect(building.at(1).toString()).to.eql("Prosumer(Scraper, 1)");
  });

  it("should ignore over- and underspeed", () => {
    const b = new Prosumer("B", processes.rt1s3, -2);
    const b2 = new Prosumer("B", processes.rt1s3, 2);
    expect(b.toString()).to.eql("Prosumer(B, 0)");
    expect(b2.toString()).to.eql("Prosumer(B, 1)");
  });

  it("should prosume: consume energy and produce resources", () => {
    const p = new Prosumer("CoalPowerPlant", processes.rt3s3, 1);
    expect(p.prosumes(resources.t3s3)).to.eql(processes.rt31s31);
    expect(p.toString()).to.eql("Prosumer(CoalPowerPlant, 1)");
  });
});
