import { expect } from "chai";

import examples, { energy, process } from "./examples";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";

describe("ResourceProcessCollection ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const processes = [
      new ResourceProcess(t3, 0),
      new ResourceProcess(s3, -1),
      process.ce1,
    ];
    const t3s3e10 = ResourceProcessCollection.fromArray(processes);
    const amount = "3tumbles+0, 3salties-1, 0energy-10";
    expect(t3s3e10.toString()).to.eql(`ResourceProcessCollection[${amount}]`);
    expect(t3s3e10.types).to.eql([t3.type, s3.type, process.ce1.type]);
  });

  it("should compare resource process collections", () => {
    const {
      t0, t3, t5, s3,
    } = examples;
    const t0p = new ResourceProcess(t0, 1);
    const t3p = new ResourceProcess(t3, 1);
    const t5p = new ResourceProcess(t5, 2);
    const s3p = new ResourceProcess(s3, 3);
    const s0p0 = new ResourceProcess(s3.zero, 0);
    const e0p = new ResourceProcess(energy.e0, -10);
    const t0c = ResourceProcessCollection.fromArray([t0p]);
    const t0e0c = ResourceProcessCollection.fromArray([t0p, e0p]);
    const t3c = ResourceProcessCollection.fromArray([t3p]);
    const t3s3 = ResourceProcessCollection.fromArray([t3p, s3p]);
    const t5s3 = ResourceProcessCollection.fromArray([t5p, s3p]);

    expect(t3s3.equals(t5s3)).to.be.false;
    expect(t5s3.equals(t3s3)).to.be.false;
    expect(t3s3.equals(t3c)).to.be.false;

    expect(t3s3.equals(t3s3)).to.be.true;
    expect(t3c.zero).to.be.eql(t0c);
    expect(t3c.zero.equals(t0c)).to.be.true;
    expect(t3c.infinite.equals(t0c)).to.be.false;
    expect(t3c.infinite.equals(t0c.infinite)).to.be.true;

    expect(t3c.get(t3.type)).to.eql(t3p);
    expect(t3c.get(s3.type)).to.eql(s0p0);

    expect(t0e0c.prettyEnergies).to.be.eql(["0 energy"]);
    /*
    How would we compare limit and or rates?
    expect(t3c.isLessOrEquals(t3)).to.be.true;
    expect(t5s3.isMoreOrEquals(s3)).to.be.true;
    */
  });

  it("should predict its end in time units", () => {
    const timeUnit: TimeUnit = 1;
    const twoTimeUnits: TimeUnit = 2;
    const {
      t0, t3, t5, t8, s3,
    } = examples;
    const t0p = new ResourceProcess(t0, -0);
    const t3p = new ResourceProcess(t3, 3);
    const t5p = new ResourceProcess(t5, 2.5); // 3
    const t52p = new ResourceProcess(t5, 2.4); // 2
    const t8p = new ResourceProcess(t8, 4);
    expect(t0p.endsIn).to.be.equal(Infinity);
    expect(t3p.endsIn).to.be.equal(timeUnit);
    expect(t5p.endsIn).to.be.equal(timeUnit);
    expect(t8p.endsIn).to.be.equal(twoTimeUnits);

    const t8mp = new ResourceProcess(t8, -4);
    expect(t8mp.endsIn).to.be.equal(twoTimeUnits);

    const s3p = new ResourceProcess(s3, 3);
    const s3p1 = new ResourceProcess(s3, 1);
    const t3s3 = ResourceProcessCollection.fromArray([t3p, s3p]);
    const t5s3 = ResourceProcessCollection.fromArray([t5p, s3p1]);
    const t52s3 = ResourceProcessCollection.fromArray([t52p, s3p1]);
    expect(t3s3.endsNextIn).to.be.equal(timeUnit);
    expect(t5s3.endsNextIn).to.be.equal(timeUnit);
    expect(t52s3.endsNextIn).to.be.equal(twoTimeUnits);
  });

  it("should add and subtract resources processes", () => {
    const {
      t0, t3, s3, s6,
    } = examples;
    const t0p = new ResourceProcess(t0, 0);
    const t3p = new ResourceProcess(t3, 1);
    const t3p0 = new ResourceProcess(t3, 0);
    const s3p = new ResourceProcess(s3, 3);
    const s3p0 = new ResourceProcess(s3, 0);
    const s3p6 = new ResourceProcess(s3, 6);
    const s6p = new ResourceProcess(s6, 3);
    const t00 = ResourceProcessCollection.fromArray([t0p]);
    const s3c = ResourceProcessCollection.fromArray([s3p]);
    const t0s3 = ResourceProcessCollection.fromArray([t0p, s3p]);
    const t0s3n = ResourceProcessCollection.fromArray([t0p, s3p.negative]);
    const t3s3 = ResourceProcessCollection.fromArray([t3p, s3p]);
    const t30s3 = ResourceProcessCollection.fromArray([t3p0, s3p]);
    const t3s3r6 = ResourceProcessCollection.fromArray([t3p, s3p6]);
    const t3s6 = ResourceProcessCollection.fromArray([t3p, s6p]);
    const t30s30 = ResourceProcessCollection.fromArray([t3p0, s3p0]);

    // Add rates, keep higher limits
    expect(t3s3.add(s3p)).to.be.eql(t3s3r6);
    // Adding nothing
    expect(t00.add(t3s3)).to.be.eql(t3s3);
    expect(t00.add(s3p)).to.be.eql(t0s3);
    expect(t00.add(s3c)).to.be.eql(t0s3);
    // Subtract rate
    expect(t3s3.subtract(t3p)).to.be.eql(t30s3);
    // If we subtract process, it should return the shortest
    // Should keep the limit
    expect(t3s3.subtract(t3s6)).to.be.eql(t30s30);
    expect(t00.subtract(s3p)).to.be.eql(t0s3n);
    expect(t00.subtract(s3c)).to.be.eql(t0s3n);
  });

  it("can be mapped generically, with a filter on undefined builtin", () => {
    const { t0, s3 } = examples;
    const t0p = new ResourceProcess(t0, 0);
    const s3p = new ResourceProcess(s3, 3);
    const t0c = ResourceProcessCollection.fromArray([t0p]);
    const t0s3c = ResourceProcessCollection.fromArray([t0p, s3p]);
    expect(t0c.map((r) => r.limit.amount)).to.be.eql([0]);
    expect(t0s3c.map((r) => r.limit.amount)).to.be.eql([0, 3]);
    expect(t0c.map((r) => r.limit.amount || undefined)).to.be.eql([]);
    expect(t0s3c.map((r) => r.limit.amount || undefined)).to.be.eql([3]);
  });
});
