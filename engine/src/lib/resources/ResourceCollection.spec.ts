import examples from './examples';
import ResourceCollection from './ResourceCollection';

describe('ResourceCollection ValueObject', () => {
  it('should be console printable', () => {
    const { t3, s3 } = examples;
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const amount = '3tumbles, 3salties';
    expect(t3s3.toString()).to.eql(`ResourceCollection[${amount}]`);
    expect(t3s3.types).to.eql([t3.type, s3.type]);
  });

  it('should be serializable', () => {
    const { t3, s3 } = examples;
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const amount = [
      { type: 'tumbles', amount: 3 },
      { type: 'salties', amount: 3 },
    ];
    expect(t3s3.toJSON()).to.eql(amount);
  });

  it('should compare resource collections', () => {
    const { t3, t5, s3 } = examples;
    const t3c = ResourceCollection.fromArray([t3]);
    const s3c = ResourceCollection.fromArray([s3]);
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const t5s3 = ResourceCollection.fromArray([t5, s3]);

    expect(t3s3.equals(t5s3)).to.be.false;
    expect(t5s3.equals(t3s3)).to.be.false;
    expect(t3s3.equals(t3c)).to.be.false;

    expect(t3c.isLessOrEquals(t3)).to.be.true;
    expect(t3c.isLessOrEquals(s3c)).to.be.true;
    expect(t3c.isLessOrEquals(s3)).to.be.true;
    expect(s3c.isLessOrEquals(t3c)).to.be.true;
    expect(s3c.isLessOrEquals(t3)).to.be.true;

    expect(t3c.isMoreOrEquals(s3c)).to.be.false;
    expect(t3c.isMoreOrEquals(s3)).to.be.false;
    expect(t5s3.isMoreOrEquals(t3s3)).to.be.true;
    expect(t5s3.isMoreOrEquals(t3)).to.be.true;
    expect(t5s3.isMoreOrEquals(s3)).to.be.true;
  });

  it('should add and subtract resources', () => {
    const { t0, t3, t8, s3, s6 } = examples;
    const t00 = ResourceCollection.fromArray([t0]);
    const s3c = ResourceCollection.fromArray([s3]);
    const t0s3 = ResourceCollection.fromArray([t0, s3]);
    const t3s3 = ResourceCollection.fromArray([t3, s3]);
    const t3s6 = ResourceCollection.fromArray([t3, s6]);

    expect(t3s3.add(s3)).to.be.eql(t3s6);

    expect(t00.add(t3s3)).to.be.eql(t3s3);
    expect(t00.add(s3)).to.be.eql(t0s3);
    expect(t00.add(s3c)).to.be.eql(t0s3);
    expect(s3c.add(t0)).to.be.eql(t0s3);
    expect(t00.subtract(t3s3)).to.be.eql(t00);

    expect(t3s3.subtract(t3)).to.be.eql(t0s3);
    // 3 - 8 = 0
    expect(t3s3.subtract(t8)).to.be.eql(t0s3);
    expect(t3s6.subtract(s3c)).to.be.eql(t3s3);
    expect(s3c.subtract(t0)).to.be.eql(t0s3);
    expect(s3c.subtract(t00)).to.be.eql(s3c);
  });

  it('should create a product from the amounts and times factor', () => {
    const { s3, s9 } = examples;
    const s3c = ResourceCollection.fromArray([s3]);
    const s9c = ResourceCollection.fromArray([s9]);
    expect(s3c.times(3)).to.be.eql(s9c);
  });

  it('can be mapped generically, with a filter on undefined builtin', () => {
    const { t0, s3 } = examples;
    const t0c = ResourceCollection.fromArray([t0]);
    const t0s3c = ResourceCollection.fromArray([t0, s3]);
    expect(t0c.map((r) => r.amount)).to.be.eql([0]);
    expect(t0s3c.map((r) => r.amount)).to.be.eql([0, 3]);
    expect(t0c.map((r) => r.amount || undefined)).to.be.eql([]);
    expect(t0s3c.map((r) => r.amount || undefined)).to.be.eql([3]);
  });
});
