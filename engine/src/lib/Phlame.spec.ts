import { Action, ActionType, ActionTypes } from './Action';

import examples, { Types } from './resources/examples';
import { stock, buildings, phlame } from './examples';
import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Phlame } from './Phlame';
import { Economy } from './Economy';

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
  it('should be serializable', () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, buildings);
    const phlame = new Phlame('Phlame', eco);
    expect(phlame.toJSON()).to.eql({
      id: 'Phlame',
      tick: 0,
      ...eco.toJSON(),
    });
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

  it('should update (in) time: ticks', () => {
    expect(phlame.lastTick).to.eql(0);

    phlame.update(1);

    expect(phlame.lastTick).to.eql(1);

    phlame.update(2);

    expect(phlame.lastTick).to.eql(2);
  });

  it('should queue and execute actions', () => {
    const eco = new Economy('Eco', stock, buildings);
    const phlame = new Phlame('InAction', eco);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 15blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)',
    );
    const action: Action<ActionType> = {
      type: ActionTypes.CREATE,
      concerns: phlame,
      consequence: {
        type: ActionTypes.UPDATE,
        at: 15,
        payload: {
          buildingID: 2,
          grade: 'up',
        },
      },
    };
    phlame.add(action);
    expect(phlame.upcoming).to.contain(action);
    console.log('productionTable 0', phlame.productionTable);
    phlame.update(1);
    console.log('productionTable 1', phlame.productionTable);
    phlame.update(2);
    console.log('productionTable 2', phlame.productionTable);
    phlame.update(15);
    // at time of the consequence
    expect(phlame.lastTick).to.eql(15);
    console.log('productionTable 15', phlame.productionTable);
    // TODO?! clean recent expect(phlame.recent).to.be.empty;
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -3/100 energy, 0/0 heat, Degraded to 94%, 303salties(0, Infinity): +81, 15blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 2, 100%)',
    );

    // TODO investigate, why do we have /100 energy now? (should be /50)?
    expect(phlame.productionTable[0]).to.eql(['energy', -3, 50]);

    // a few ticks later
    phlame.update(20);
    expect(phlame.lastTick).to.eql(20);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -3/100 energy, 0/0 heat, Degraded to 94%, 708salties(0, Infinity): +81, 10blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 2, 100%)',
    );

    // uh oh - out of energy
    phlame.update(30);
    expect(phlame.lastTick).to.eql(30);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -3/100 energy, 0/0 heat, Degraded to 94%, 1518salties(0, Infinity): +81, 0blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 2, 100%)',
    );

    // halting now
    phlame.update(31);
    expect(phlame.lastTick).to.eql(31);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -53/0 energy, 0/0 heat, Degraded to 0%, 1518salties(0, Infinity): 0, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) ' +
        'Building(12, 1, 0%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 2, 100%)',
    );
  });

  // TODO? it("should queue a maximum of a type of actions");

  it.todo(
    'should have env properties - e.g. base temperature and amounts of resources to start from',
  );
  // idea: use parts of the ID for random data
});
