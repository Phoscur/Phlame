import examples, { TumbleResource, ResourceTypes } from './examples';
import { Resource } from './Resource';

describe('Resource ValueObject', () => {
  it('should be console printable', () => {
    const resource = new TumbleResource(0);
    expect(resource.toString()).to.eql(`Resource[0${ResourceTypes.Tumble}]`);
  });

  it('should be serializable', () => {
    const serialized = { type: 'tumbles', amount: 3 };
    const resource = new TumbleResource(3);
    expect(resource.toJSON()).to.eql(serialized);
  });

  it('should only accept resources by type, else return null', () => {
    const resource = new Resource('unknown', 0);
    expect(resource.toString()).to.eql(`Resource[0${Resource.Null.type}]`);
  });

  it('is usually int32 but it can be infinite', () => {
    const { t0, t3, t5, t8 } = examples;
    expect(t0.isLessOrEquals(t0.infinite)).to.be.true;
    expect(t0.infinite.isMoreOrEquals(t0)).to.be.true;

    expect(t3.infinite.add(t5)).to.be.eql(t3.infinite);
    expect(t8.infinite.subtract(t5)).to.be.eql(t3.infinite);
    expect(t3.infinite.times(3)).to.be.eql(t3.infinite);
  });

  it('should compare resources', () => {
    const { t3, t5, s3 } = examples;
    const t3a = new TumbleResource(3);
    expect(t3.equals(t3a)).to.be.true;
    expect(t3.equals(t5)).to.be.false;

    expect(t3.equals(s3)).to.be.false;

    expect(() => {
      t3.isMoreOrEquals(s3);
    }).to.throw(TypeError);
    expect(() => {
      t3.isLessOrEquals(s3);
    }).to.throw(TypeError);

    expect(t3.isLessOrEquals(t5)).to.be.true;
    expect(t5.isMoreOrEquals(t3)).to.be.true;
  });

  it('should add and subtract resources', () => {
    const { t0, t3, t5, t8, s3 } = examples;
    expect(t3.add(t5)).to.be.eql(t8);
    expect(t3.addAmount(5)).to.be.eql(t8);
    expect(t3.add(t5.infinite)).to.be.eql(t3.infinite);
    expect(t8.subtract(t5)).to.be.eql(t3);
    // 5 - 8 = 0
    expect(t5.subtract(t8)).to.be.eql(t0);
    expect(t5.infinite.subtract(t8)).to.be.eql(t0.infinite);

    expect(() => {
      t3.add(s3);
    }).to.throw(TypeError);
    expect(() => {
      t3.subtract(s3);
    }).to.throw(TypeError);
  });

  it('should create a product from amount and times factor', () => {
    const { s3, s9 } = examples;
    expect(s3.times(3)).to.be.eql(s9);
  });
});
