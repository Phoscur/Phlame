import { expect } from "chai";

import examples from "./examples";
import ResourceCollection from "./ResourceCollection";
import ResourceProcessCollection from "./ResourceProcessCollection";
import ResourceProcess from "./ResourceProcess";

describe("ResourceProcessCollection ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const processes = [new ResourceProcess(t3, 0), new ResourceProcess(s3, 1)];
    const t3s3 = ResourceProcessCollection.fromArray(processes);
    const amount = "3tumbles, 3salties";
    expect(t3s3.toString()).to.eql(`ResourceProcessCollection[${amount}]`);
  });

  it.skip("should compare resource process collections", () => {
    const { t3, t5, s3 } = examples;
    const t3c = ResourceCollection.fromArray([t3]);
    const s3c = ResourceCollection.fromArray([s3]);
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const t5s3 = ResourceCollection.fromArray([t5, s3]);

    expect(t3s3.equals(t5s3)).to.be.false;
    expect(t5s3.equals(t3s3)).to.be.false;

    expect(t3c.isLessOrEquals(t3)).to.be.true;
    expect(t3c.isLessOrEquals(s3c)).to.be.true;
    expect(t3c.isLessOrEquals(s3)).to.be.true;
    expect(s3c.isLessOrEquals(t3c)).to.be.true;
    expect(s3c.isLessOrEquals(t3)).to.be.true;

    expect(t3c.isMoreOrEquals(s3c)).to.be.false;
    expect(t3c.isMoreOrEquals(s3)).to.be.false;
    expect(t5s3.isMoreOrEquals(t3s3)).to.be.true;
    expect(t5s3.isMoreOrEquals(t3)).to.be.true;
    expect(t5s3.isMoreOrEquals(s3)).to.be.true;
  });

  it.skip("should add and subtract resources processes", () => {
    const {
      t0, t3, t8, s3, s6,
    } = examples;
    const t00 = ResourceCollection.fromArray([t0]);
    const t0s3 = ResourceCollection.fromArray([t0, s3]);
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const t3s6 = ResourceCollection.fromArray([t3, s6]);

    expect(t3s3.add(s3)).to.be.eql(t3s6);
    expect(t00.add(t3s3)).to.be.eql(t3s3);
    expect(t3s3.subtract(t3)).to.be.eql(t0s3);
    // 3 - 8 = 0
    expect(t3s3.subtract(t8)).to.be.eql(t0s3);
  });
});
