
import { expect } from "chai";

import examples from "./examples";

import ResourceProcess from "./ResourceProcess";

describe("ResourceProcess ValueObject", () => {
  it("should be console printable", () => {
    const { t0, t3 } = examples;
    const resourceProcess = new ResourceProcess(t0, 0);
    const production = "tumbles, 0, 0";
    expect(resourceProcess.toString()).to.eql(`ResourceProcess[${production}]`);
    const infinite = new ResourceProcess(t0.infinite, 0);
    const infProduction = "tumbles, 0, Infinity";
    expect(infinite.toString()).to.eql(`ResourceProcess[${infProduction}]`);
    const pi = new ResourceProcess(t3, Math.sqrt(Math.PI));
    const piProd = "tumbles, 1.7724538509055159, 3";
    expect(pi.toString()).to.eql(`ResourceProcess[${piProd}]`);
  });

  it("should compare resource processes", () => {
    const { t3, s3 } = examples;
    const t3p = new ResourceProcess(t3, 0);
    const s3p = new ResourceProcess(s3, 0);
    expect(t3p.equals(s3p)).to.be.false;
  });

  it.skip("should add and subtract resources processes", () => {
    //
  });
});
