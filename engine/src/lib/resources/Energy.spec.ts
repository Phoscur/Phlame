import { energy, EnergyResource, EnergyTypes } from './examples';

describe('Energy Resource ValueObject', () => {
  it('should be console printable', () => {
    const { e0 } = energy;
    expect(e0.toString()).to.eql(`Energy[0${EnergyTypes.Electricity}]`);
  });

  it('is int32 and immutable, very similar to a Resource but never infinite', () => {
    const { e0, e10 } = energy;

    expect(e0.add(e10)).to.be.eql(e10);
    expect(e10.subtract(e0)).to.be.eql(e10);
    expect(e10.infinite.times(3)).to.be.eql(e10.zero);
  });

  it('should compare energy amounts', () => {
    const { em10, e0, e10, h0 } = energy;
    const e10a = new EnergyResource(10);
    expect(e10.equals(e10a)).to.be.true;
    expect(e0.equals(e10)).to.be.false;

    expect(e0.equals(h0)).to.be.false;

    expect(() => {
      e10.isMoreOrEquals(h0);
    }).to.throw(TypeError);
    expect(() => {
      e0.isLessOrEquals(h0);
    }).to.throw(TypeError);

    expect(e0.isLessOrEquals(e10)).to.be.true;
    expect(em10.isLessOrEquals(e10)).to.be.true;
    expect(e10.isMoreOrEquals(e0)).to.be.true;
  });

  it('should add and subtract energy amounts', () => {
    const { em10, e0, e10, h0, h10 } = energy;
    expect(e0.add(e10)).to.be.eql(e10);
    expect(e0.infinite.add(e10)).to.be.eql(e0.infinite);
    expect(e0.add(e0.infinite)).to.be.eql(e0.infinite);
    expect(e0.addAmount(10)).to.be.eql(e10);
    expect(e10.subtract(e0)).to.be.eql(e10);
    expect(e0.subtract(e10)).to.be.eql(em10);

    expect(() => {
      e0.add(h10);
    }).to.throw(TypeError);
    expect(() => {
      e0.subtract(h0);
    }).to.throw(TypeError);
  });
});
