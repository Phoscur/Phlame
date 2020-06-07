import { expect } from "chai";

import { energy, EnergyResource, ResourceTypes } from "./examples";

describe("Energy Resource ValueObject", () => {
  it("should be console printable", () => {
    const { e0 } = energy;
    expect(e0.toString()).to.eql(`Energy[0${ResourceTypes.Electricity}]`);
  });

  it("is int32 and immutable, very similar to a Resource but never infinite", () => {
    const { e0, e10 } = energy;

    expect(e0.add(e10)).to.be.eql(e10);
    expect(e10.subtract(e0)).to.be.eql(e10);
  });

  it("should compare energy amounts", () => {
    const { e0, e10, b0 } = energy;
    const e10a = new EnergyResource(10);
    expect(e10.equals(e10a)).to.be.true;
    expect(e0.equals(e10)).to.be.false;

    expect(e0.equals(b0)).to.be.false;

    expect(() => {
      e10.isMoreOrEquals(b0);
    }).to.throw(TypeError);
    expect(() => {
      e0.isLessOrEquals(b0);
    }).to.throw(TypeError);

    expect(e0.isLessOrEquals(e10)).to.be.true;
    expect(e10.isMoreOrEquals(e0)).to.be.true;
  });

  it("should add and subtract energy amounts", () => {
    const {
      e0, e10,
      b0, b10,
    } = energy;
    expect(e0.add(e10)).to.be.eql(e10);
    expect(e10.subtract(e0)).to.be.eql(e10);
    // 5 - 8 = 0
    expect(e0.subtract(e10)).to.be.eql(e0);

    expect(() => {
      e0.add(b10);
    }).to.throw(TypeError);
    expect(() => {
      e0.subtract(b0);
    }).to.throw(TypeError);
  });
});
