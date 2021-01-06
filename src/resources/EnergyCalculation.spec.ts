import { expect } from "chai";

import examples, { Types, processes } from "./examples";
import ResourceCollection from "./ResourceCollection";
import Stock from "./Stock";
import ResourceCalculation from "./ResourceCalculation";
import ResourceProcess, { TimeUnit } from "./ResourceProcess";
import ResourceProcessCollection from "./ResourceProcessCollection";
import Prosumer from "./Prosumer";
import EnergyCalculation from "./EnergyCalculation";
import ProsumerCollection from "./ProsumerCollection";

describe("EnergyCalculation (extended ResourceCalculation) ValueObject", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const prosumers = new ProsumerCollection<Types>([
      new Prosumer("EnergyProducer", processes.energy),
      new Prosumer("EnergyProducer", processes.energy),
      new Prosumer("EnergyProducer", processes.energy),
    ]);
    const resourceCalculation = new ResourceCalculation(stock, resourceProcesses);
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers);
    expect(energyCalculation.productionTable).to.eql([
      "150/150 energy",
      "3tumbles(0, Infinity): +1",
      "3salties(0, Infinity): -1",
    ]);
    expect(energyCalculation.prettyProsumers).to.eql([
      "Prosumer(EnergyProducer, 100%, ResourceProcessCollection[0energy+50])", "Prosumer(EnergyProducer, 100%, ResourceProcessCollection[0energy+50])", "Prosumer(EnergyProducer, 100%, ResourceProcessCollection[0energy+50])",
    ]);
    expect(energyCalculation.toString()).to.eql(
      "Processing energy&resources: 150/150 energy, 3tumbles(0, Infinity): +1, 3salties(0, Infinity): -1",
    );
  });

  it("should calculate with time units", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, resourceProcesses);
    const prosumers = new ProsumerCollection<Types>([
      new Prosumer("EnergyProducer", processes.energy),
    ]);
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers);
    const timeUnits: TimeUnit = 1;

    const oneSecondLater = energyCalculation.calculate(timeUnits);
    expect(oneSecondLater.toString()).to.eql(
      "Processing energy&resources: 50/50 energy, 4tumbles(0, Infinity): +1, 2salties(0, Infinity): -1",
    );

    const anotherSecondLater = oneSecondLater.calculate(timeUnits);
    expect(anotherSecondLater.toString()).to.eql(
      "Processing energy&resources: 50/50 energy, 5tumbles(0, Infinity): +1, 1salties(0, Infinity): -1",
    );

    const emptySalties = anotherSecondLater.calculate(timeUnits);
    expect(emptySalties.toString()).to.eql(
      "Processing energy&resources: 50/50 energy, 6tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );

    // Continuing with negative rate wont substract any more, because resources can't be negative
    // At this point we need to recalculate all processes (with adapted rates) especially for energy outage
    const emptySaltiesStill = emptySalties.calculate(timeUnits);
    expect(emptySaltiesStill.toString()).to.eql(
      "Processing energy&resources: 50/50 energy, 7tumbles(0, Infinity): +1, 0salties(0, Infinity): -1",
    );
  });

  it("should calculate remaining time units", () => {
    const { t3, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t3, 1),
      new ResourceProcess(s3, -1),
    ]);
    const stock = new Stock(resources);
    const resourceCalculation = new ResourceCalculation(stock, resourceProcesses);
    const prosumers = new ProsumerCollection<Types>([]);
    const energyCalculation = new EnergyCalculation(resourceCalculation, prosumers);
    const timeUnits: TimeUnit = 3;
    expect(energyCalculation.validFor).to.be.equal(timeUnits);
  });

  it("should know how many time units can be calculated within the current limits", () => {
    const { t3, t5, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2),
      new ResourceProcess(s3, -1),
    ]);

    const resourceLimits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, resourceLimits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, resourceProcesses);
    const prosumers = new ProsumerCollection<Types>([new Prosumer("Plant", resourceProcesses, 1)]);
    const energyCalculation = new EnergyCalculation(limitedResourceCalculation, prosumers);
    const limitedTimeUnits: TimeUnit = 1;
    expect(energyCalculation.validFor).to.be.equal(limitedTimeUnits);
    // console.log(`${energyCalculation}:\n${energyCalculation.productionTable}`);
  });

  it("should know when it is over limits", () => {
    const { t3, t5, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 2.5), // 0.8
      new ResourceProcess(s3, -1), // 3
    ]);

    const resourceLimits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, resourceLimits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, resourceProcesses);
    const prosumers = new ProsumerCollection<Types>([]);
    const energyCalculation = new EnergyCalculation(limitedResourceCalculation, prosumers);

    const limitedTimeUnits: TimeUnit = 0; // Actually 0.8, but that's not an integer
    expect(energyCalculation.validFor).to.be.equal(limitedTimeUnits);
  });

  it("should know when it is under limits", () => {
    const { t3, t5, s3 } = examples;
    const resources = ResourceCollection.fromArray([t3, s3]);
    const resourceProcesses = ResourceProcessCollection.fromArray([
      new ResourceProcess(t5, 0.5), // 2 (1*2=5-3)
      new ResourceProcess(s3, -1), // 3
    ]);

    const resourceLimits = ResourceCollection.fromArray([t5, s3]);
    const limitedStock = new Stock(resources, resourceLimits);
    const limitedResourceCalculation = new ResourceCalculation(limitedStock, resourceProcesses);
    const prosumers = new ProsumerCollection<Types>([]);
    const energyCalculation = new EnergyCalculation(limitedResourceCalculation, prosumers);

    const limitedTimeUnits: TimeUnit = 2;
    expect(energyCalculation.validFor).to.be.equal(limitedTimeUnits);
  });
});
