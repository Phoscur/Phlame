import examples, { energy, process } from './examples';

import ResourceProcess, { TimeUnit } from './ResourceProcess';

describe('ResourceProcess ValueObject', () => {
  it('should be console printable', () => {
    const { t0, t3 } = examples;
    const resourceProcess = new ResourceProcess(t0, 0);
    const production = 'tumbles, 0, 0';
    expect(resourceProcess.toString()).to.eql(`ResourceProcess[${production}]`);
    const infinite = new ResourceProcess(t0.infinite, 0);
    const infProduction = 'tumbles, 0, Infinity';
    expect(infinite.toString()).to.eql(`ResourceProcess[${infProduction}]`);
    const pi = new ResourceProcess(t3, Math.sqrt(Math.PI));
    const piProd = 'tumbles, 2, 3';
    expect(pi.toString()).to.eql(`ResourceProcess[${piProd}]`);
    const energy = 'energy, 50, 0';
    expect(process.pe1.toString()).to.eql(`ResourceProcess[${energy}]`);
  });

  it('should compare resource processes', () => {
    const { t3, s3 } = examples;
    const t3p = new ResourceProcess(t3, 0);
    const s3p = new ResourceProcess(s3, 0);
    expect(t3p.equals(s3p)).to.be.false;
    expect(t3p.equals(t3p)).to.be.true;
  });

  it('should predict its end in time units', () => {
    const timeUnit: TimeUnit = 1;
    const twoTimeUnits: TimeUnit = 2;
    const infiniteTime: TimeUnit = Number.POSITIVE_INFINITY;
    const { t0, t3, t5, t8 } = examples;
    const t0p = new ResourceProcess(t0, 0);
    const t3p = new ResourceProcess(t3, 3);
    const t3p0 = new ResourceProcess(t3, 0);
    const t5p = new ResourceProcess(t5, 2.5); // 3
    const t8p = new ResourceProcess(t8, 4);
    expect(t0p.endsIn).to.be.equal(infiniteTime);
    expect(t3p0.endsIn).to.be.equal(infiniteTime);
    expect(t3p.endsIn).to.be.equal(timeUnit);
    expect(t5p.endsIn).to.be.equal(timeUnit);
    expect(t8p.endsIn).to.be.equal(twoTimeUnits);

    const t8mp = new ResourceProcess(t8, -4);
    expect(t8mp.endsIn).to.be.equal(twoTimeUnits);
  });

  it('should produce or consume resources over time', () => {
    const zero: TimeUnit = 0;
    const timeUnit: TimeUnit = 1;
    const twoTimeUnits: TimeUnit = 2;
    const { t0, t3, t5, t6, t8 } = examples;
    const t0p = new ResourceProcess(t0, 0);
    const t3p = new ResourceProcess(t3, 3);
    const t5p = new ResourceProcess(t5, 2.5);
    const t8p = new ResourceProcess(t8, -4);
    const e0p = new ResourceProcess(energy.e0, 0);
    expect(t0p.getResourceFor()).to.be.eql(t0);
    expect(e0p.getResourceFor(zero)).to.be.eql(energy.e0);
    expect(t0p.getResourceFor(timeUnit)).to.be.eql(t0);
    expect(t3p.getResourceFor(timeUnit)).to.be.eql(t3);
    expect(t5p.getResourceFor(twoTimeUnits)).to.be.eql(t6);
    expect(t8p.getResourceFor(twoTimeUnits)).to.be.eql(t8);
  });

  it('should add and subtract resources processes', () => {
    const { t3, t5, t8, s3 } = examples;
    const t3p = new ResourceProcess(t3, 1);
    const t5p = new ResourceProcess(t5, 1);
    const t5p2 = new ResourceProcess(t5, 2);
    const t8p = new ResourceProcess(t8, 1);
    const t8p2 = new ResourceProcess(t8, 2);
    const t8p3 = new ResourceProcess(t8, 3);
    const s3p = new ResourceProcess(s3, 3);

    // Keep upper bounds
    // 3 + 5 = 5
    expect(t3p.add(t5p)).to.be.eql(t5p2);
    // 8 - 5 = 8
    expect(t8p3.subtract(t5p)).to.be.eql(t8p2);
    expect(t8p3.add(t5p.negative)).to.be.eql(t8p2);
    // 5 - 8 = 8
    expect(t5p2.subtract(t8p)).to.be.eql(t5p);

    expect(() => {
      t3p.add(s3p);
    }).to.throw(TypeError);
    expect(() => {
      t3p.subtract(s3p);
    }).to.throw(TypeError);
  });
});
