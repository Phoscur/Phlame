import Action, { ActionTypes } from "./Action";

import examples, { Types } from "./resources/examples";
import { stock, buildings } from "./examples";
import ResourceCollection from "./resources/ResourceCollection";
import Stock from "./resources/Stock";
import Phlame from "./Phlame";

describe("Phlame Entity", () => {
  it("should be console printable", () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const phlame = new Phlame("Economy", exampleStock, buildings);
    expect(phlame.toString()).to.eql(
      "Economy (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)",
    );
  });

  it("should have resources to mine from", () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const world = new Phlame("Planet", exampleStock, buildings);
    expect(world.toString()).to.eql(
      "Planet (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)",
    );
  });

  it("should queue actions", () => {
    const phlame = new Phlame("InAction", stock, buildings);
    expect(phlame.toString()).to.eql(
      "InAction (Stock[3tumbles(0, Infinity), 3salties(0, Infinity), 15blubbs(0, Infinity)]) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)",
    );
    const action: Action<ActionTypes> = {
      type: ActionTypes.CREATE,
      concerns: phlame,
      consequence: {
        type: ActionTypes.UPDATE,
        at: 15,
        payload: {
          id: 1,
          level: 2,
        },
      },
    };
    phlame.add(action);
    expect(phlame.recent).to.contain(action);
  });

  //it("should queue a maximum of a type of actions");

  // it.todo("should have env properties - e.g. base temperature to start from");
});
