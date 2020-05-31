import { expect } from "chai";

import examples, { Types } from "./resources/examples";
import ResourceCollection from "./resources/ResourceCollection";
import Stock from "./resources/Stock";
import Building from "./Building";
import Empire from "./Empire";

describe("Empire Entity", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const empire = new Empire("Empire", stock);
    expect(empire.toString()).to.eql("Empire (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) []");
  });

  it("should have resources and buildings", () => {
    const { t3, s3 } = examples;
    const buildings: Building[] = [];
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const empire = new Empire("AllFresh", stock, buildings);
    expect(empire.toString()).to.eql("AllFresh (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) []");
  });
});
