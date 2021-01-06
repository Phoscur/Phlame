import { expect } from "chai";

import examples, { energy, process, processes } from "./examples";
import Prosumer from "./Prosumer";

describe("Prosumer ValueObject", () => {
  it("should be console printable", () => {
    const b = new Prosumer("B", processes.rt11s31);
    expect(b.toString()).to.eql("Prosumer(B, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
  });

  it("should have resource processes", () => {
    const speed = 50;
    const building = new Prosumer("Scraper", processes.rt11s31, speed);
    // rounding up
    expect(building.toString()).to.eql("Prosumer(Scraper, 50%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
    expect(building.at(100).toString()).to.eql(
      "Prosumer(Scraper, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])",
    );
  });

  it("should ignore over- and underspeed", () => {
    const b = new Prosumer("B", processes.rt11s31, -2);
    const b0 = new Prosumer("B", processes.rt11s31, 0);
    const b2 = new Prosumer("B", processes.rt11s31, 200);
    expect(b.toString()).to.eql("Prosumer(B, 0%, ResourceProcessCollection[1tumbles+0, 3salties+0])");
    expect(b0.toString()).to.eql("Prosumer(B, 0%, ResourceProcessCollection[1tumbles+0, 3salties+0])");
    expect(b2.toString()).to.eql("Prosumer(B, 100%, ResourceProcessCollection[1tumbles+1, 3salties+1])");
  });

  it("should prosume: consume energy and produce resources", () => {
    const t = new Prosumer("TumbleFactory", processes.tumbles, 50);
    expect(t.consumes(energy.e0)?.rate).to.eql(process.ce1.rate / 2);
    expect(t.produces(examples.t0)?.rate).to.eql(process.pt1.rate / 2);
  });

  it("should prosume: consume salties and produce energy", () => {
    const p = new Prosumer("SaltyPowerPlant", processes.prosumption, 100);
    expect(p.consumes(energy.e0)).to.eql(undefined);
    expect(p.consumes(examples.s10)).to.eql(process.cs1);
    expect(p.consumes(examples.t0)).to.eql(undefined);
    expect(p.produces(energy.e0)).to.eql(process.pe1);
    expect(p.produces(examples.s10)).to.eql(undefined);
    expect(p.produces(examples.t0)).to.eql(undefined);
    expect(p.prosumes).to.eql(processes.prosumption);
    expect(p.toString()).to.eql("Prosumer(SaltyPowerPlant, 100%, ResourceProcessCollection[10salties-1, 0energy+50])");
  });
});
