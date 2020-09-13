import { expect } from "chai";

import examples, { Types, energy } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";
import ResourceCalculation from "./ResourceCalculation";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Prosumer from "./Prosumer";
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
    const prosumers: Prosumer<Types>[] = [];
    const limits = [e10];
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers, limits);

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
    const prosumers: Prosumer<Types>[] = [];
    const limits = [e10];
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers, limits);
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
    // At this point we need to recalculate all processes (with adapted rates) especially for energy outage
    const emptySaltiesStill = emptySalties.calculate(timeUnits);
    expect(emptySaltiesStill.toString()).to.eql(
      "Processing energy&resources: 10energy - 7tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );
  });

  it("should know to calculate remaining time units", () => {
    const { t3, s3 } = examples;
    const { e10 } = energy;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, processes);
    const prosumers: Prosumer<Types>[] = [];
    const limits = [e10];
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers, limits);
    const timeUnits: TimeUnit = 3;
    expect(energyCalculation.validFor).to.be.equal(timeUnits);
  });

  it("should know how many time units can be calculated within the current limits", () => {
    const { t3, t5, s3 } = examples;
    const { e10 } = energy;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2),
      new ResourceProcess(s3, -1),
    ]);

    const resourceLimits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, resourceLimits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, processes);
    const prosumers: Prosumer<Types>[] = [new Prosumer("Plant", processes, 1)];
    const limits = [e10];
    const energyCalculation = new EnergyCalculation(limitedResourceCalculation, prosumers, limits);
    const limitedTimeUnits: TimeUnit = 1;
    expect(energyCalculation.validFor).to.be.equal(limitedTimeUnits);
    // console.log(`${energyCalculation}:\n${energyCalculation.productionTable}`);
  });

  it("should know when it is over limits", () => {
    const { t3, t5, s3 } = examples;
    const { e10 } = energy;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const processes = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2.5),
      new ResourceProcess(s3, -1),
    ]);

    const resourceLimits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, resourceLimits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, processes);
    const prosumers: Prosumer<Types>[] = [];
    const limits = [e10];
    const energyCalculation = new EnergyCalculation(limitedResourceCalculation, prosumers, limits);

    const limitedTimeUnits: TimeUnit = 0; // Actually 0.8, but that's not an integer
    expect(energyCalculation.validFor).to.be.equal(limitedTimeUnits);
  });

  it("should know when it is under limits");
});
