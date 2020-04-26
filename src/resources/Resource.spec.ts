/* eslint max-classes-per-file: "off" */
import { expect } from "chai";

import Resource from "./Resource";

const TESTY_TYPE = "testies";
Resource.types.push(TESTY_TYPE);
class TestyResource extends Resource {
  constructor(amount: number) {
    super(TESTY_TYPE, amount);
  }
}
const SALTY_TYPE = "salties";
Resource.types.push(SALTY_TYPE);
class SaltyResource extends Resource {
  constructor(amount: number) {
    super(SALTY_TYPE, amount);
  }
}

describe("Resource ValueObject", () => {
  it("should be console printable", () => {
    const resource = new TestyResource(0);
    expect(resource.toString()).to.eql(`Resource[0${TESTY_TYPE}]`);
  });

  it("should compare resources", () => {
    const r1 = new TestyResource(3);
    const r1a = new TestyResource(3);
    const r2 = new TestyResource(5);
    const s = new SaltyResource(3);
    expect(r1.equals(r1a)).to.be.true;
    expect(r1.equals(r2)).to.be.false;
    expect(r1.equals(s)).to.be.false;

    expect(() => r1.isMoreThan(s)).to.throw(TypeError);
    expect(() => r1.isLessOrEquals(s)).to.throw(TypeError);

    expect(r1.isLessOrEquals(r2)).to.be.true;
    expect(r2.isMoreThan(r1)).to.be.true;
  });

  it("should add and subtract resources", () => {
    const r0 = new TestyResource(0);
    const r1 = new TestyResource(3);
    const r2 = new TestyResource(5);
    const r3 = new TestyResource(8);
    expect(r1.add(r2)).to.be.eql(r3);
    expect(r3.subtract(r2)).to.be.eql(r1);
    // 5 - 8 = 0
    expect(r2.subtract(r3)).to.be.eql(r0);
  });

  it("should create a product from amount and times factor", () => {
    const s3 = new SaltyResource(3);
    const s9 = new SaltyResource(9);
    expect(s3.times(3)).to.be.eql(s9);
  });
});
