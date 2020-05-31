import { expect } from "chai";

import examples, { Types } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";

describe("Stock (ResourceCollection with limits) ValueObject", () => {
  it("should be console printable", () => {
    const {
      t1, t3, t8, s3,
    } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const stocks = "3tumbles(0, Infinity), 3salties(0, Infinity)";
    expect(stock.toString()).to.eql(`Stock[${stocks}]`);

    const stockWithLimits = new Stock<Types>(
      ResourceCollection.fromArray([t3, s3]),
      ResourceCollection.fromArray([t8]),
      ResourceCollection.fromArray([t1]),
    );
    const stocksLimited = "3tumbles(1, 8), 3salties(0, Infinity)";
    expect(stockWithLimits.toString()).to.eql(`Stock[${stocksLimited}]`);
  });

  it("can fetch and store", () => {
    const { t0, t3, s3 } = examples;
    const stock = new Stock(ResourceCollection.fromArray([t3, s3]));
    const stock2 = new Stock(ResourceCollection.fromArray([t0, s3]));
    const stock0 = new Stock(ResourceCollection.fromArray([t0]));
    expect(stock.fetch(t3)).to.eql(stock2);
    expect(stock2.store(t3)).to.eql(stock);
    expect(stock0.getResource(s3)).to.be.eql(s3.zero);
  });

  it("has limits", () => {
    const { t0, t3, s3 } = examples;
    const t0c = ResourceCollection.fromArray([t0]);
    const t3c = ResourceCollection.fromArray([t3]);
    const stock = new Stock(t3c, undefined, t0c);
    const stock0 = new Stock(t0c, t0c, t0c);

    expect(stock.getMaxResource(t0)).to.be.eql(t0.infinite);
    expect(stock0.getMinResource(t0)).to.be.eql(t0);

    expect(stock.getMinResource(t0)).to.be.eql(t3);
    expect(stock.getMaxResource(t0)).to.be.eql(t3.infinite);

    expect(stock.getMinResource(s3)).to.be.eql(s3.zero);
    expect(stock.getMaxResource(s3)).to.be.eql(s3.infinite);
  });

  it("can check to fit (its) limits", () => {
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

  it("is fetchable", () => {
    const { t0, t3, s3 } = examples;
    const st30 = ResourceCollection.fromArray([t0, s3]);
    const st3 = ResourceCollection.fromArray([t3, s3]);
    const multiStock = new Stock(st30);
    expect(multiStock.isFetchable(st3)).to.be.false;
  });
});
