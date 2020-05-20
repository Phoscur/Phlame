import { expect } from "chai";

import examples from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";
import ResourceCalculation from "./ResourceCalculation";

describe("ResourceCalculation (ResourceCollection with limits) ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const stock = new Stock(ResourceCollection.fromArray([t3, s3]));
    const resourceCalculation = new ResourceCalculation(stock);
    expect(resourceCalculation.toString()).to.eql(`Resources[${stock}]`);
  });
});
