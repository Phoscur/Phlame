import { Economy } from './Economy';
import { ResourceCollection, ResourceProcess, Stock } from './resources';
import { TumbleResource, BlubbResource, SaltyResource, ResourceTypes } from './resources/examples';
import { stock, buildings, overconsumingBuildings, underBlubberBuildings } from './examples';

/**
 * At first glance, an Economy is like a Planet from our ancestorial game, however it covers edge cases differently:
 * When Blubbs "Fuel" is burnt to exhaustion, this can bring an Economy down to a slow grind if it would rely on this energy source primarily (e.g. Solar not available).
 * Of course one could just simply ignore the "Fusionskraftwerkbug", due to the secondary function as energy source and abundance of fuel, it is simply not economic to produce less than burnt.
 * This engine aims to allow for all kinds of resource cascades though (instead of just ignoring the underflow).
 * It cannot be simply configured to allow for the "buggy" behaviour, maybe with negative infinity as lower limit, while resetting to 0 as needed.
 *
 * TODOs:
 * - queuing buildings, research (& units) - externally time delayed?
 * - buildings increasing build speed
 * - research unlocking features (buildings, units, speed improvements, ...)
 * - buildings producing units
 * - (un-)loading units
 */
describe('Economy', () => {
  it('should be console printable', () => {
    const empty = new Economy('Empty', stock, []);
    expect(empty.toString()).to.eql('Empty (Processing energy&resources: ) []');

    const factory = new Economy('Console', stock, [buildings[0], buildings[2]]);
    expect(factory.toString()).to.eql(
      'Console (Processing energy&resources: ' +
        '50/50 energy, 0/0 heat, ' +
        '3tumbles(0, Infinity): 0, ' +
        '3salties(0, Infinity): 0, ' +
        '15blubbs(0, Infinity): -10' +
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    expect(factory.stock.toString()).to.eql(
      'Stock[3tumbles(0, Infinity), 3salties(0, Infinity), 15blubbs(0, Infinity)]',
    );
  });

  it('should be serializable', () => {
    const empty = new Economy('Empty', stock, []);
    expect(empty.toJSON()).to.eql({
      buildings: [],
      name: 'Empty',
      stock: {
        resources: [
          { amount: 3, type: ResourceTypes.Tumble },
          { amount: 3, type: ResourceTypes.Salty },
          { amount: 15, type: ResourceTypes.Blubber },
        ],
      },
    });

    const factory = new Economy('Console', stock, [buildings[0], buildings[2]]);
    expect(factory.toJSON()).to.eql({
      buildings: [
        {
          level: 1,
          speed: 100,
          type: 12,
        },
        { level: 1, speed: 50, type: 0 },
      ],
      name: 'Console',
      stock: {
        resources: [
          { amount: 3, type: ResourceTypes.Tumble },
          { amount: 3, type: ResourceTypes.Salty },
          { amount: 15, type: ResourceTypes.Blubber },
        ],
      },
    });
  });

  it('should have resources and buildings', () => {
    const factory = new Economy('Factory', stock, buildings);
    expect(factory.toString()).to.eql(
      'Factory (Processing energy&resources: ' +
        '30/50 energy, 0/0 heat, ' +
        '3salties(0, Infinity): +20, ' +
        '15blubbs(0, Infinity): 0, ' + // -10+10
        '3tumbles(0, Infinity): 0' + // TODO? fix ordering for zero (missing) resource production
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(3, 1, 100%), ' +
        'Building(0, 1, 50%), ' +
        'Building(2, 1, 100%)' +
        ']',
    );
    expect(factory.resources.validFor).to.be.eql(Infinity);
    // TODO! a factory with minimal default buildings
    // TODO storage limits 22, 23, 24
    // TODO buildings for build speed upgrades 14, 15
    // TODO building space and expansion 33
    // TODO lab 31
    // TODO And/Or (Building|Tech)Requirement
    // TODO hangar 21 able to produce other units like ships 202, 203 with cargo capacity
    // and misc
    // TODO tech lab requirement 113 <= 31L1
    // TODO tech for build requirements energy 12 <= 3L5, 113L3
    // TODO lab network for tech speed up and tech share (with outsourcing cost)?
  });

  it('can upgrade buildings, in time', () => {
    const factory = new Economy('Factory', stock, buildings);
    // TODO check substracted resources
    // TODO check build time
    expect(factory.upgrade(factory.buildings[0].type).toString()).to.eql(
      'Factory (Processing energy&resources: ' +
        '194/214 energy, 0/0 heat, ' +
        '3salties(0, Infinity): +20, ' +
        '15blubbs(0, Infinity): -33, ' +
        '3tumbles(0, Infinity): 0' +
        ') [' +
        'Building(12, 2, 100%), ' +
        'Building(3, 1, 100%), ' +
        'Building(0, 1, 50%), ' +
        'Building(2, 1, 100%)' +
        ']',
    );
    expect(factory.downgrade(factory.buildings[0].type).toString()).to.eql(
      'Factory (Processing energy&resources: ' +
        '-20/0 energy, 0/0 heat, ' +
        'Degraded to 0%, ' +
        '3salties(0, Infinity): 0, ' +
        '15blubbs(0, Infinity): 0, ' +
        '3tumbles(0, Infinity): 0' +
        ') [' +
        'Building(12, 0, 100%), ' +
        'Building(3, 1, 100%), ' +
        'Building(0, 1, 50%), ' +
        'Building(2, 1, 100%)' +
        ']',
    );
  });

  it('should tick: simply exhausting fuel', () => {
    // burn resources for unused energy, which doesn't accumulate
    const stock = new Stock<ResourceTypes>(ResourceCollection.fromArray([new BlubbResource(30)]));
    const factory = new Economy('Tick', stock, [buildings[0], buildings[2]]);
    expect(factory.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '50/50 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '30blubbs(0, Infinity): -10' +
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    const ft1 = factory.tick();
    expect(ft1.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '50/50 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '20blubbs(0, Infinity): -10' +
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    const ft2 = ft1.tick();
    expect(ft2.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '50/50 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '10blubbs(0, Infinity): -10' +
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    expect(ft2.resources.validFor).to.be.eql(1);
    const ft3 = ft2.tick();
    expect(ft3.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '50/50 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '0blubbs(0, Infinity): -10' +
        ') [' +
        'Building(12, 1, 100%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    expect(ft3.resources.validFor).to.be.eql(0);
    // without a recalculation strategy this would bug out
    expect(() => {
      const ft3i = ft2.tick();
      ft3i.recalculationStrategy = (dont, care, bs) => bs;
      const ft4i = ft3i.tick();
      expect(ft4i.toString()).to.eql(
        'Tick (Processing energy&resources: ' +
          '50/50 energy, 0/0 heat, ' +
          '0tumbles(0, Infinity): 0, ' +
          '0salties(0, Infinity): 0, ' +
          '0blubbs(0, Infinity): -10' +
          ') [' +
          'Building(12, 1, 100%), ' +
          'Building(0, 1, 50%)' +
          ']',
      );
    }).to.throw('Invalid resource (re)calculation');

    // now things are offline everything is fine
    const ft4 = ft3.tick();
    expect(ft4.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '0/0 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '0blubbs(0, Infinity): 0' +
        ') [' +
        'Building(12, 1, 0%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    const ft5 = ft4.tick();
    expect(ft5.toString()).to.eql(
      'Tick (Processing energy&resources: ' +
        '0/0 energy, 0/0 heat, ' +
        '0tumbles(0, Infinity): 0, ' +
        '0salties(0, Infinity): 0, ' +
        '0blubbs(0, Infinity): 0' +
        ') [' +
        'Building(12, 1, 0%), ' +
        'Building(0, 1, 50%)' +
        ']',
    );
    expect(ft5.resources.validFor).to.be.eql(Infinity);
  });

  // a) tumble plant (ID 1) is upgraded and now overconsumption slows everything, even more when blubber fuel runs out
  it('a series of ticks retriggering recalculations with different impacts', () => {
    // first rates are already bad because e.g. recently upgraded building consumes more energy than solar provides
    // then blubbs run out again, so the drop brings everything to a slow grind
    const tumbles = new TumbleResource(10);
    const blubbs = new BlubbResource(30);
    const stock = new Stock<ResourceTypes>(
      ResourceCollection.fromArray([tumbles, new SaltyResource(0), blubbs]),
    );
    const factory = new Economy('Overtumbling', stock, overconsumingBuildings);
    // full rate would be 129, but -13/50 energy degrades it
    const tumbleProcess = new ResourceProcess(tumbles.infinite, 129 * (50 / (13 + 50)) ** 1.1);
    const blubbProcess = new ResourceProcess(blubbs, 8 - 10);
    expect(factory.resources.resources.processes.getByType(tumbleProcess.type)).to.eql(
      tumbleProcess,
    );
    expect(factory.resources.resources.processes.getByType(blubbProcess.type)).to.eql(blubbProcess);
    // under energy & even more under energy after blubber drop
    expect(factory.resources.productionEntries).to.eql([
      '-13/50 energy',
      '0/0 heat',
      'Degraded to 78%', //
      '10tumbles(0, Infinity): +100', // degraded from 129
      '0salties(0, Infinity): +16', // degraded from 20
      '30blubbs(0, Infinity): -2', // degraded from 0 (10-10, 8-10 instead)
    ]);
    expect(factory.toString()).to.eql(
      'Overtumbling (Processing energy&resources: ' +
        '-13/50 energy, 0/0 heat, ' +
        'Degraded to 78%, ' +
        '10tumbles(0, Infinity): +100, ' + // degraded from 129
        '0salties(0, Infinity): +16, ' + // degraded from 20
        '30blubbs(0, Infinity): -2' + // degraded from 0
        ') [' +
        'Building(12, 1, 100%), ' + // consumes blubbs for energy
        'Building(1, 2, 100%), ' + // just upgraded tumbles
        'Building(2, 1, 100%), ' + // salties
        'Building(3, 1, 100%), ' + // produces blubbs
        'Building(0, 1, 50%)' +
        ']',
    );
    expect(factory.resources.validFor).to.be.eql(15);
    const f15 = factory.tick(15);
    expect(f15.resources.productionEntries).to.eql([
      '-13/50 energy',
      '0/0 heat',
      'Degraded to 78%', //
      '1510tumbles(0, Infinity): +100',
      '240salties(0, Infinity): +16',
      '0blubbs(0, Infinity): -2',
    ]);
    expect(f15.resources.validFor).to.be.eql(0);
    const ff = f15.tick();
    expect(ff.resources.productionEntries).to.eql([
      '-63/0 energy',
      '0/0 heat',
      'Degraded to 0%',
      '1510tumbles(0, Infinity): 0',
      '240salties(0, Infinity): 0',
      '0blubbs(0, Infinity): 0',
    ]);
    expect(ff.resources.validFor).to.be.eql(Infinity);
  });

  // b) blubber power (ID 12) is upgraded to more consumption than the production plant (ID 3) offers with empty buffers
  it('should cover the rare blubber underflow', () => {
    // this feels a bit redundant with the test above, but it should be more common
    const stock = new Stock<ResourceTypes>(
      ResourceCollection.fromArray([
        new TumbleResource(10),
        new SaltyResource(0),
        new BlubbResource(40),
      ]),
    );
    const factory = new Economy('Underblubbling', stock, underBlubberBuildings);
    expect(factory.resources.productionEntries).to.eql([
      '171/234 energy',
      '0/0 heat',
      '40blubbs(0, Infinity): -33',
      '10tumbles(0, Infinity): +129',
      '0salties(0, Infinity): +20',
    ]);
    expect(factory.resources.validFor).to.be.eql(1);
    const f2 = factory.tick(2);
    expect(f2.resources.productionEntries).to.eql([
      '-43/40 energy',
      '0/0 heat',
      'Degraded to 28%',
      // TODO fix ordering, always tumble mine first?
      '10blubbs(0, Infinity): +3', // degraded
      '176tumbles(0, Infinity): +37', // degraded
      '26salties(0, Infinity): +6', // degraded
    ]);
    expect(f2.toString()).to.eql(
      'Underblubbling (Processing energy&resources: ' +
        '-43/40 energy, 0/0 heat, ' +
        'Degraded to 28%, ' +
        '10blubbs(0, Infinity): +3, ' +
        '176tumbles(0, Infinity): +37, ' +
        '26salties(0, Infinity): +6' +
        //+ "26salties(0, Infinity): +6, "
        //+ "10blubbs(0, Infinity): +3"
        ') [' +
        'Building(12, 2, 0%), ' +
        'Building(1, 2, 100%), ' + // just upgraded
        'Building(2, 1, 100%), ' +
        'Building(3, 1, 100%), ' +
        'Building(0, 1, 50%), ' +
        'Building(4, 1, 100%)' +
        ']',
    );
  });
});
