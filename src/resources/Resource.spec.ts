import { expect } from "chai";

import examples, { TumbleResource, TUMBLE_TYPE } from "./examples";

describe("Resource ValueObject", () => {
  it("should be console printable", () => {
    const resource = new TumbleResource(0);
    expect(resource.toString()).to.eql(`Resource[0${TUMBLE_TYPE}]`);
  });

  it("should compare resources", () => {
    const { t3, t5, s3 } = examples;
    const t3a = new TumbleResource(3);
    expect(t3.equals(t3a)).to.be.true;
    expect(t3.equals(t5)).to.be.false;
    expect(t3.equals(s3)).to.be.false;

    expect(() => {
      t3.isMoreOrEquals(s3);
    }).to.throw(TypeError);
    expect(() => {
      t3.isLessOrEquals(s3);
    }).to.throw(TypeError);

    expect(t3.isLessOrEquals(t5)).to.be.true;
    expect(t5.isMoreOrEquals(t3)).to.be.true;
  });

  it("should add and subtract resources", () => {
    const {
      t0, t3, t5, t8,
    } = examples;
    expect(t3.add(t5)).to.be.eql(t8);
    expect(t8.subtract(t5)).to.be.eql(t3);
    // 5 - 8 = 0
    expect(t5.subtract(t8)).to.be.eql(t0);
  });

  it("should create a product from amount and times factor", () => {
    const { s3, s9 } = examples;
    expect(s3.times(3)).to.be.eql(s9);
  });
});
