import {
  Economy,
  ResourceCollection,
  ResourceIdentifier,
  ResourceTable,
  Stock,
} from '@phlame/engine';
import { emptyStock, defaultBuildings } from './buildings';
import { LiquidResource } from './resources';

describe("Building's Economy", () => {
  it('should be console printable', () => {
    const empty = new Economy('Empty', emptyStock, []);
    expect(empty.toString()).to.eql('Empty (Processing energy&resources: ) []');
    expect(empty.resources.productionTable).to.eql([]);

    const factory = new Economy('Default', emptyStock, defaultBuildings);
    const table: ResourceTable<ResourceIdentifier> = [
      ['energy', 0, 40],
      ['metallic', 30, 0, Infinity, 0],
      ['crystalline', 20, 0, Infinity, 0],
      ['liquid', 0, 0, Infinity, 0],
    ];
    expect(factory.resources.productionTable).to.eql(table);
    expect(factory.toString()).to.eql(
      'Default (Processing energy&resources: ' +
        '0/40 energy, ' +
        '0metallic(0, Infinity): +30, ' +
        '0crystalline(0, Infinity): +20, ' +
        '0liquid(0, Infinity): 0' +
        ') [' +
        'Building(mine-metallic, 1, 100%), ' +
        'Building(mine-crystalline, 1, 100%), ' +
        'Building(mine-liquid, 0, 100%), ' +
        'Building(power-solar, 1, 100%)' +
        ']',
    );
    expect(factory.stock.toString()).to.eql(
      'Stock[0metallic(0, Infinity), 0crystalline(0, Infinity), 0liquid(0, Infinity)]',
    );
  });

  it.todo('should have resources and buildings', () => {
    const stock = new Stock(ResourceCollection.fromArray([new LiquidResource(30)]));
    const factory = new Economy('Factory', stock, defaultBuildings);
    const table: ResourceTable<ResourceIdentifier> = [
      ['energy', 0, 40],
      ['metallic', 30, 0, Infinity, 0],
      ['crystalline', 20, 0, Infinity, 0],
      ['liquid', 0, 30, Infinity, 0],
    ];
    expect(factory.resources.productionTable).to.eql(table);
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

  it.todo('can upgrade buildings, in time', () => {
    const factory = new Economy('Factory', emptyStock, defaultBuildings);
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
});
