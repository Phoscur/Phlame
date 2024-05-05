import ResourceCollection from './resources/ResourceCollection';
import Stock from './resources/Stock';
import type { BuildingIdentifier } from './Building';
import Phlame from './Phlame';
import Empire from './Empire';
import examples, { Types } from './resources/examples';
import { buildings } from './examples';

describe('Empire Entity', () => {
  it('should be console printable', () => {
    const empire = new Empire('Empire', []);
    expect(empire.toString()).to.eql('Empire []');
  });

  it('should have resources and buildings', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const phlame = new Phlame<Types, BuildingIdentifier>('Phlame', stock, buildings);
    const empire = new Empire('Empirial', [phlame]);
    expect(empire.toString()).to.eql(
      'Empirial [Phlame (Stock[3tumbles(0, Infinity), 3salties(0, Infinity)]) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)]',
    );
  });
});
