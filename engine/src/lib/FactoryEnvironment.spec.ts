import examples, { Types } from './resources/examples';
import ResourceCollection from './resources/ResourceCollection';
import Stock from './resources/Stock';
import FactoryEnvironment from './FactoryEnvironment';

describe('FactoryEnvironment Entity', () => {
  it('should be console printable', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const empire = new FactoryEnvironment('FactoryEnvironment', stock);
    expect(empire.toString()).to.eql(
      'FactoryEnvironment (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)])',
    );
  });

  it('should have resources to mine from', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const empire = new FactoryEnvironment('Planet', stock);
    expect(empire.toString()).to.eql(
      'Planet (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)])',
    );
  });

  // it.todo("should have properties - e.g. base temperature to start from");
});
