import { expect } from "chai";

import examples, { Types } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";

describe("Stock (ResourceCollection with limits) ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const stocks = "3tumbles(0, Infinity), 3salties(0, Infinity)";
    expect(stock.toString()).to.eql(`Stock[${stocks}]`);
  });

  it("can fetch and store", () => {
    const { t0, t3, s3 } = examples;
    const stock = new Stock(ResourceCollection.fromArray([t3, s3]));
    const stock2 = new Stock(ResourceCollection.fromArray([t0, s3]));
    expect(stock.fetch(t3)).to.eql(stock2);
    expect(stock2.store(t3)).to.eql(stock);
  });

  it("can check (its) limits", () => {
    const { t0, t3 } = examples;
    const t0c = ResourceCollection.fromArray([t0]);
    const t3c = ResourceCollection.fromArray([t3]);
    const stock = new Stock(t3c);
    const stock0 = new Stock(t0c, t0c, t0c);
    const invalidStock = new Stock(t3c, t0c, t0c);
    expect(stock.isInLimits(t3)).to.be.true;
    expect(invalidStock.isInLimits()).to.be.false;
    expect(invalidStock.isInLimits(t0)).to.be.false;
    expect(stock0.isInLimits(t0)).to.be.true;
    expect(stock0.isInLimits(t3)).to.be.false;
  });
});
