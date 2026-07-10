import { Action, ActionType, ActionTypes, ActionFactory } from './Action';

import examples, { Types } from './resources/examples';
import { stock, phelopments, defaultPhelopments, phlame, phormulae } from './examples';
import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Phlame } from './Phlame';
import { Economy } from './Economy';

describe('Phlame Entity', () => {
  it('should be console printable', () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, phelopments, phormulae);
    const phlame = new Phlame('Phlame', eco);
    expect(phlame.toString()).to.eql(
      'Phlame (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 1, 100%)',
    );
  });
  it('should be serializable', () => {
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, phelopments, phormulae);
    const phlame = new Phlame('Phlame', eco);
    expect(phlame.toJSON()).to.eql({
      id: 'Phlame',
      tick: 0,
      actions: [],
      ...eco.toJSON(),
    });
  });

  it('should have resources to mine from', () => {
    // TODO should relate to an empire (and its economies)
    const { t3, s3 } = examples;
    const exampleStock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', exampleStock, phelopments, phormulae);
    const world = new Phlame('Planet', eco);
    expect(world.toString()).to.eql(
      'Planet (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 1, 100%)',
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
    const eco = new Economy('Eco', stock, phelopments, phormulae);
    const phlame = new Phlame('InAction', eco);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 15blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 1, 100%)',
    );
    const action: Action<ActionType> = {
      type: ActionTypes.CREATE,
      concerns: phlame,
      consequence: {
        type: ActionTypes.UPDATE,
        at: 15,
        payload: {
          phelopmentID: 2,
          grade: 'up',
          startedAt: 11,
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
      'InAction (Processing energy&resources: -3/50 energy, 0/0 heat, Degraded to 94%, 303salties(0, Infinity): +81, 15blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 2, 100%)',
    );

    // energy limit is the production capacity (50), even when the net rate is negative
    expect(phlame.productionTable[0]).to.eql(['energy', -3, 50]);

    // a few ticks later
    phlame.update(20);
    expect(phlame.lastTick).to.eql(20);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -3/50 energy, 0/0 heat, Degraded to 94%, 708salties(0, Infinity): +81, 10blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 2, 100%)',
    );

    // uh oh - out of energy
    phlame.update(30);
    expect(phlame.lastTick).to.eql(30);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -3/50 energy, 0/0 heat, Degraded to 94%, 1518salties(0, Infinity): +81, 0blubbs(0, Infinity): -1, 3tumbles(0, Infinity): 0) ' +
        'Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 2, 100%)',
    );

    // halting now
    phlame.update(31);
    expect(phlame.lastTick).to.eql(31);
    expect(phlame.toString()).to.eql(
      'InAction (Processing energy&resources: -53/0 energy, 0/0 heat, Degraded to 0%, 1518salties(0, Infinity): 0, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) ' +
        'Phelopment(12, 1, 0%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 2, 100%)',
    );
  });

  it('should wait for affordable costs before starting a build (Wartefunktion)', () => {
    // L1 mines produce 30 tumbles + 20 salties/tick, stock starts at 3/3 -
    // upgrading mine 1 costs 135 tumbles/33 salties: 5 ticks of waiting, then 4 ticks of building
    const eco = new Economy('Eco', stock, defaultPhelopments, phormulae);
    const waiting = new Phlame('Waiting', eco);
    // a naive `at` estimate (duration only, like the service's initial guess) must NOT
    // make the queued action silently expire while it waits to become affordable
    waiting.add(new ActionFactory().updatePhelopment(4, waiting, 1, 'up', 'wartefunktion'));

    waiting.update(9);

    expect(waiting.lastTick).to.eql(9);
    const { phelopments: built, stock: stocked, actions } = waiting.toJSON();
    expect(built.find((p) => p.type === 1)?.level).to.eql(2);
    expect(waiting.upcoming).to.have.length(0);
    // costs were fetched at start (tick 5): 3 + 5*30 - 135 + 4*30 = 138 tumbles
    expect(stocked.resources.find((r) => r.type === 'tumbles')?.amount).to.eql(138);
    expect(stocked.resources.find((r) => r.type === 'salties')?.amount).to.eql(150);
    expect(actions[0].consequence.payload['startedAt']).to.eql(5);
  });

  it('should refuse to queue beyond the Phormulae-ruled slots', () => {
    const eco = new Economy('Eco', stock, defaultPhelopments, phormulae);
    const crowded = new Phlame('Crowded', eco);
    const factory = new ActionFactory();
    expect(crowded.queueSlots).to.eql(5);
    for (let i = 0; i < 5; i++) {
      crowded.add(factory.updatePhelopment(90 + i, crowded, 1, 'up', `q${i}`));
    }
    expect(() =>
      crowded.add(factory.updatePhelopment(99, crowded, 1, 'up', 'overflow')),
    ).to.throw('Queue is full (5/5)');
    // a slot frees up once a consequence applies
    crowded.update(50);
    expect(crowded.upcoming.length).to.be.lessThan(5);
  });

  // TODO? it("should queue a maximum of a type of actions");

  it.todo(
    'should have env properties - e.g. base temperature and amounts of resources to start from',
  );
  // idea: use parts of the ID for random data
});
