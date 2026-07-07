import { stock, phormulae, Resources } from './examples';
import { phormulae as typesOnlyPhormulae } from './resources/examples';
import { Building, BuildingIdentifier } from './Building';
import { Economy } from './Economy';
import { ResourceCollection } from './resources';
import { SaltyResource, TumbleResource } from './resources/examples';

describe('Building', () => {
  it('should be console printable', () => {
    const b = new Building<Resources, BuildingIdentifier>('B');
    expect(b.toString()).to.eql('Building(B, 0, 100%)');
  });

  it('should be serializable', () => {
    const b = new Building<Resources, BuildingIdentifier>('B');
    expect(b.toJSON()).to.eql({
      type: 'B',
      level: 0,
      speed: 100,
    });
  });

  it('should be pure state with level and speed operations', () => {
    const building = new Building<Resources, BuildingIdentifier>('Scraper', 5, 50);
    expect(building.toString()).to.eql('Building(Scraper, 5, 50%)');
    expect(building.upgraded.toString()).to.eql('Building(Scraper, 6, 50%)');
    expect(building.downgraded.toString()).to.eql('Building(Scraper, 4, 50%)');
    expect(building.at(100).toString()).to.eql('Building(Scraper, 5, 100%)');
    expect(building.disabled.toString()).to.eql('Building(Scraper, 5, 0%)');
  });

  it('should have costs and build times, computed by the economy from the Phormulae', () => {
    const economy = new Economy<Resources, BuildingIdentifier>('Interpreter', stock, [], phormulae);
    const unknown = new Building<Resources, BuildingIdentifier>('Scraper', 5, 50);
    const mine = new Building<Resources, BuildingIdentifier>(1, 5, 50);

    expect(() => economy.upgradeCost(unknown)).to.throw(
      'Unknown building requirement, BuildingType: Scraper',
    );
    expect(() => economy.downgradeCost(unknown)).to.throw(
      'Unknown building requirement, BuildingType: Scraper',
    );

    expect(economy.upgradeCost(mine)).to.eql(
      ResourceCollection.fromArray([new TumbleResource(683), new SaltyResource(170)]),
    );
    expect(economy.downgradeCost(mine)).to.eql(
      ResourceCollection.fromArray([new TumbleResource(341), new SaltyResource(79)]),
    );
    expect(economy.upgradeTime(mine)).to.eql(20);
    expect(economy.downgradeTime(mine)).to.eql(10);
  });

  it('should be a prosumer, interpreted by the economy', () => {
    const economy = new Economy<Resources, BuildingIdentifier>('Interpreter', stock, [], phormulae);
    const b = new Building<Resources, BuildingIdentifier>(12, 1, 50);
    expect(economy.prosumes(b).toString()).to.eql(
      'Prosumer(12, 50%, ResourceProcessCollection[15blubbs-5, 0energy+25])',
    );

    // without prosumption rules (types-only Phormulae) a building prosumes nothing
    const bare = new Economy<Resources, BuildingIdentifier>(
      'Bare',
      stock,
      [],
      typesOnlyPhormulae,
    );
    const bnot = new Building<Resources, BuildingIdentifier>(12, 1, 0);
    expect(bare.prosumes(bnot).toString()).to.eql('Prosumer(12, 0%, ResourceProcessCollection[])');
  });

  it('should ignore over- and underspeed', () => {
    const b = new Building<Resources, BuildingIdentifier>('B', 1, -200);
    const b2 = new Building<Resources, BuildingIdentifier>('B', 1, 200);
    expect(b.toString()).to.eql('Building(B, 1, 0%)');
    expect(b2.toString()).to.eql('Building(B, 1, 100%)');
  });
});
