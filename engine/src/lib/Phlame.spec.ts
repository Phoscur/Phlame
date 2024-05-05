import Action, { ActionTypes } from './Action';

import examples, { Types } from './resources/examples';
import { stock, buildings } from './examples';
import ResourceCollection from './resources/ResourceCollection';
import Stock from './resources/Stock';
import Phlame from './Phlame';
import Economy from './Economy';

describe('Phlame Entity', () => {
  it('should be console printable', () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, buildings);
    const phlame = new Phlame('Phlame', eco);
    expect(phlame.toString()).to.eql(
      'Phlame (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)',
    );
  });

  it('should have resources to mine from', () => {
    // TODO should relate to an empire (and its economies)
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, buildings);
    const world = new Phlame('Planet', eco);
    expect(world.toString()).to.eql(
      'Planet (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)',
    );
  });

  it('should queue actions', () => {
    const eco = new Economy('Eco', stock, buildings);
    const phlame = new Phlame('InAction', eco);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 15blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)',
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
