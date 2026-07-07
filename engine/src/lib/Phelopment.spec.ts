import { stock, phormulae, Resources } from './examples';
import { phormulae as typesOnlyPhormulae } from './resources/examples';
import { Phelopment, PhelopmentIdentifier } from './Phelopment';
import { Economy } from './Economy';
import { ResourceCollection } from './resources';
import { SaltyResource, TumbleResource } from './resources/examples';

describe('Phelopment', () => {
  it('should be console printable', () => {
    const b = new Phelopment<Resources, PhelopmentIdentifier>('B');
    expect(b.toString()).to.eql('Phelopment(B, 0, 100%)');
  });

  it('should be serializable', () => {
    const b = new Phelopment<Resources, PhelopmentIdentifier>('B');
    expect(b.toJSON()).to.eql({
      type: 'B',
      level: 0,
      speed: 100,
    });
  });

  it('should be pure state with level and speed operations', () => {
    const phelopment = new Phelopment<Resources, PhelopmentIdentifier>('Scraper', 5, 50);
    expect(phelopment.toString()).to.eql('Phelopment(Scraper, 5, 50%)');
    expect(phelopment.upgraded.toString()).to.eql('Phelopment(Scraper, 6, 50%)');
    expect(phelopment.downgraded.toString()).to.eql('Phelopment(Scraper, 4, 50%)');
    expect(phelopment.at(100).toString()).to.eql('Phelopment(Scraper, 5, 100%)');
    expect(phelopment.disabled.toString()).to.eql('Phelopment(Scraper, 5, 0%)');
  });

  it('should have costs and build times, computed by the economy from the Phormulae', () => {
    const economy = new Economy<Resources, PhelopmentIdentifier>('Interpreter', stock, [], phormulae);
    const unknown = new Phelopment<Resources, PhelopmentIdentifier>('Scraper', 5, 50);
    const mine = new Phelopment<Resources, PhelopmentIdentifier>(1, 5, 50);

    expect(() => economy.upgradeCost(unknown)).to.throw(
      'Unknown phelopment requirement, PhelopmentType: Scraper',
    );
    expect(() => economy.downgradeCost(unknown)).to.throw(
      'Unknown phelopment requirement, PhelopmentType: Scraper',
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
    const economy = new Economy<Resources, PhelopmentIdentifier>('Interpreter', stock, [], phormulae);
    const b = new Phelopment<Resources, PhelopmentIdentifier>(12, 1, 50);
    expect(economy.prosumes(b).toString()).to.eql(
      'Prosumer(12, 50%, ResourceProcessCollection[15blubbs-5, 0energy+25])',
    );

    // without prosumption rules (types-only Phormulae) a phelopment prosumes nothing
    const bare = new Economy<Resources, PhelopmentIdentifier>(
      'Bare',
      stock,
      [],
      typesOnlyPhormulae,
    );
    const bnot = new Phelopment<Resources, PhelopmentIdentifier>(12, 1, 0);
    expect(bare.prosumes(bnot).toString()).to.eql('Prosumer(12, 0%, ResourceProcessCollection[])');
  });

  it('should ignore over- and underspeed', () => {
    const b = new Phelopment<Resources, PhelopmentIdentifier>('B', 1, -200);
    const b2 = new Phelopment<Resources, PhelopmentIdentifier>('B', 1, 200);
    expect(b.toString()).to.eql('Phelopment(B, 1, 0%)');
    expect(b2.toString()).to.eql('Phelopment(B, 1, 100%)');
  });
});
