import { EnergyResource } from "./examples";
import Prosumer from "./Prosumer";
import ProsumerCollection from "./ProsumerCollection";
import ResourceProcess from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";

describe("ProsumerCollection ValueObject", () => {
  it("should be console printable", () => {
    const collection = new ProsumerCollection([
      new Prosumer(1, ResourceProcessCollection.fromArray([])),
      new Prosumer(2, ResourceProcessCollection.fromArray([])),
    ]);
    expect(collection.toString()).to.be.eql(
      "ProsumerCollection[" +
        "Prosumer(1, 100%, ResourceProcessCollection[]), " +
        "Prosumer(2, 100%, ResourceProcessCollection[])" +
        "]",
    );
  });

  it("should return reduced/summed up prosumer resource processes", () => {
    const collection = new ProsumerCollection([
      new Prosumer(
        4,
        ResourceProcessCollection.fromArray([
          new ResourceProcess(new EnergyResource(Infinity), 10),
        ]),
      ),
      new Prosumer(
        12,
        ResourceProcessCollection.fromArray([
          new ResourceProcess(new EnergyResource(Infinity), 10),
        ]),
      ),
    ]);
    const reduced = ResourceProcessCollection.fromArray([
      new ResourceProcess(new EnergyResource(Infinity), 20),
    ]);
    expect(collection.reduced).to.eql(reduced);
  });

  it("should map/filter", () => {
    const collection = new ProsumerCollection([
      new Prosumer(1, ResourceProcessCollection.fromArray([])),
      new Prosumer(2, ResourceProcessCollection.fromArray([])),
    ]);
    expect(collection.map((p) => (p.type === 1 ? 1 : undefined))).to.eql([1]);
  });
});
