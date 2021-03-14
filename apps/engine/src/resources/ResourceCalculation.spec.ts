import { expect } from "chai";

import examples, { process } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";
import ResourceCalculation from "./ResourceCalculation";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";

describe("ResourceCalculation (ResourceCollection with limits) ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
      process.pe1, // this doesn't actually work, that's what EnergyCalculation is for, but it's still printable
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, processes);

    expect(resourceCalculation.toString()).to.eql(
      "Processing resources: 3tumbles(0, Infinity): +1, 3salties(0, Infinity): -1, 0energy(0, Infinity): +50",
    );
  });

  it("should calculate with time units", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const timeUnits: TimeUnit = 1;

    const oneSecondLater = resourceCalculation.calculate(timeUnits);
    expect(oneSecondLater.toString()).to.eql(
      "Processing resources: 4tumbles(0, Infinity): +1, 2salties(0, Infinity): -1",
    );

    const anotherSecondLater = oneSecondLater.calculate(timeUnits);
    expect(anotherSecondLater.toString()).to.eql(
      "Processing resources: 5tumbles(0, Infinity): +1, 1salties(0, Infinity): -1",
    );

    const emptySalties = anotherSecondLater.calculate(timeUnits);
    expect(emptySalties.toString()).to.eql(
      "Processing resources: 6tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );

    // Continuing with negative rate wont substract any more, because resources can't be negative
    const emptySaltiesStill = emptySalties.calculate(timeUnits);
    expect(emptySaltiesStill.toString()).to.eql(
      "Processing resources: 7tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );
  });

  it("should know to calculate remaining time units", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const timeUnits: TimeUnit = 3;
    expect(resourceCalculation.validFor).to.be.equal(timeUnits);
  });

  it("should know how many time units can be calculated within the current limits", () => {
    const { t3, t5, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2),
      new ResourceProcess(s3, -1),
    ]);

    const limits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, limits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, processes);
    const limitedTimeUnits: TimeUnit = 1;
    expect(limitedResourceCalculation.validFor).to.be.equal(limitedTimeUnits);
  });

  it("should know when it is over limits", () => {
    const { t3, t5, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2.5),
      new ResourceProcess(s3, -1),
    ]);

    const limits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, limits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, processes);
    const limitedTimeUnits: TimeUnit = 0; // Actually 0.8, but that's not an integer
    expect(limitedResourceCalculation.validFor).to.be.equal(limitedTimeUnits);
  });
});
