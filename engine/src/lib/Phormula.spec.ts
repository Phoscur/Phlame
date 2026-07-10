import { Phormula } from './Phormula';

describe('Phormula', () => {
  it('should evaluate polynomial growth like the old closures', () => {
    const production = Phormula.polynomial(30);
    const consumption = Phormula.polynomial(-10);
    // reference: (lvl) => 30 * lvl * lvl ** 1.1
    expect(production.at(1)).to.eql(30);
    expect(production.at(2)).to.eql(30 * 2 * 2 ** 1.1);
    expect(consumption.at(2)).to.eql(-10 * 2 * 2 ** 1.1);
    expect(Phormula.zero().at(42)).to.eql(0);
  });

  it('should be console printable', () => {
    expect(Phormula.polynomial(30).toString()).to.eql('Phormula[30*lvl^(1+1.1)]');
    expect(Phormula.zero().toString()).to.eql('Phormula[0]');
  });

  it('should hold level-independent rule values as constants', () => {
    const slots = Phormula.constant(5);
    expect(slots.at(0)).to.eql(5);
    expect(slots.at(42)).to.eql(5);
    expect(slots.toString()).to.eql('Phormula[5]');
  });

  it('should serialize canonically and round-trip', () => {
    const polynomial = Phormula.polynomial(20, 1.2);
    expect(polynomial.toJSON()).to.eql({ kind: 'polynomial', coefficient: 20, exponent: 1.2 });
    expect(Phormula.zero().toJSON()).to.eql({ kind: 'zero' });
    expect(Phormula.constant(5).toJSON()).to.eql({ kind: 'constant', value: 5 });

    const revived = Phormula.fromJSON(polynomial.toJSON());
    expect(revived.at(3)).to.eql(polynomial.at(3));
    expect(Phormula.fromJSON({ kind: 'zero' }).at(3)).to.eql(0);
    expect(Phormula.fromJSON({ kind: 'constant', value: 7 }).at(3)).to.eql(7);
  });
});
