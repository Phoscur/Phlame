import { expect } from "chai";

import { processes } from "./examples";
import Prosumer from "./Prosumer";

describe("Prosumer ValueObject", () => {
  it("should be console printable", () => {
    const b = new Prosumer("B", processes.rt11s31);
    expect(b.toString()).to.eql("Prosumer(B, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
  });

  it("should have resources", () => {
    const speed = 50;
    const building = new Prosumer("Scraper", processes.rt11s31, speed);
    expect(building.toString()).to.eql("Prosumer(Scraper, 50%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
    expect(building.at(100).toString()).to.eql(
      "Prosumer(Scraper, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])",
    );
  });

  it("should ignore over- and underspeed", () => {
    const b = new Prosumer("B", processes.rt11s31, -2);
    const b0 = new Prosumer("B", processes.rt11s31, 0);
    const b2 = new Prosumer("B", processes.rt11s31, 200);
    expect(b.toString()).to.eql("Prosumer(B, 0%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
    expect(b0.toString()).to.eql("Prosumer(B, 0%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
    expect(b2.toString()).to.eql("Prosumer(B, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
  });

  it("should prosume: consume energy and produce resources", () => {
    const p = new Prosumer("CoalPowerPlant", processes.prosumption, 100);
    expect(p.prosumes()).to.eql(processes.prosumption);
    expect(p.toString()).to.eql("Prosumer(CoalPowerPlant, 100%, ResourceProcessCollection[10salties-1, 0energy-10])");
  });
});
