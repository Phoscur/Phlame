import { expect } from "chai";

import examples, { energy } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";
import ResourceCalculation from "./ResourceCalculation";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Consumer from "./Consumer";
import EnergyCalculation from "./EnergyCalculation";

describe("EnergyCalculation (extended ResourceCalculation) ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const { e10 } = energy;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const consumers: Consumer[] = [];
    const limits = [e10];
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const energyCalculation = new EnergyCalculation(resourceCalculation, consumers, limits);

    expect(energyCalculation.toString()).to.eql(
      "Processing energy&resources: 10energy - 3tumbles(0, Infinity): +1, 3salties(0, Infinity): -1",
    );
  });

  it("should calculate with time units", () => {
    const { t3, s3 } = examples;
    const { e10 } = energy;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const consumers: Consumer[] = [];
    const limits = [e10];
    const energyCalculation = new EnergyCalculation(resourceCalculation, consumers, limits);
    const timeUnits: TimeUnit = 1;

    const oneSecondLater = energyCalculation.calculate(timeUnits);
    expect(oneSecondLater.toString()).to.eql(
      "Processing energy&resources: 10energy - 4tumbles(0, Infinity): +1, 2salties(0, Infinity): -1",
    );

    const anotherSecondLater = oneSecondLater.calculate(timeUnits);
    expect(anotherSecondLater.toString()).to.eql(
      "Processing energy&resources: 10energy - 5tumbles(0, Infinity): +1, 1salties(0, Infinity): -1",
    );

    const emptySalties = anotherSecondLater.calculate(timeUnits);
    expect(emptySalties.toString()).to.eql(
      "Processing energy&resources: 10energy - 6tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );

    // Continuing with negative rate wont substract any more, because resources can't be negative
    // At this point we need to recalculate all processes (with )
    const emptySaltiesStill = emptySalties.calculate(timeUnits);
    expect(emptySaltiesStill.toString()).to.eql(
      "Processing energy&resources: 10energy - 7tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );
  });
});
