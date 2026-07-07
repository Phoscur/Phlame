import examples, { Types } from './resources/examples';
import { PhelopmentRequirement } from './PhelopmentRequirement';
import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Economy } from './Economy';

describe('PhelopmentRequirement', () => {
  it('should be console printable', () => {
    const { t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    // const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    // const factory = new Factory("Fact1", stock);
    const b = new PhelopmentRequirement('B', ress, 1.5, []);
    expect(b.toString()).to.eql('PhelopmentRequirement(B)');
  });

  it('should have resources and phelopments', () => {
    const { t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const factory = new Economy('Fact2', stock);
    const type = 'B';
    const level = 1;
    const b = new PhelopmentRequirement(type, ress, 1, []);

    expect(b.toString()).to.eql('PhelopmentRequirement(B)');
    expect(b.matches(type)).to.eql(true);
    expect(b.isSatisfied(level, factory.resources)).to.eql(true);
    expect(b.isSatisfiedForDowngrade(level, factory.resources)).to.eql(true);
    expect(b.getUpgradeCost(level).toString()).to.eql('ResourceCollection[3tumbles, 3salties]');
    expect(b.getDowngradeCost(level).toString()).to.eql('ResourceCollection[1tumbles, 1salties]');
  });

  it('should not have enough resources', () => {
    const { t0, t3, s3 } = examples;
    const ress = ResourceCollection.fromArray([t3, s3]);
    const stock0 = new Stock<Types>(ResourceCollection.fromArray([t0, s3]));
    const factory = new Economy('Fact3', stock0);
    const level = 1;
    const b = new PhelopmentRequirement('B', ress, 2, []);

    expect(b.toString()).to.eql('PhelopmentRequirement(B)');
    expect(b.isSatisfied(level, factory.resources)).to.eql(false);
  });
});
