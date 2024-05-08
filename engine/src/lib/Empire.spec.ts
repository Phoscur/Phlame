import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Economy } from './Economy';
import { Phlame } from './Phlame';
import { Empire } from './Empire';
import examples, { Types } from './resources/examples';
import { buildings } from './examples';
import type { BuildingIdentifier } from './Building';

describe('Empire Entity', () => {
  it('should be console printable', () => {
    const empire = new Empire('Empire', []);
    expect(empire.toString()).to.eql('Empire []');
  });

  it('should have resources and buildings', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));

    const eco = new Economy('Eco', stock, buildings);
    const phlame = new Phlame<Types, BuildingIdentifier>('Phlame', eco);
    const empire = new Empire('Empirial', [phlame]);
    expect(empire.toString()).to.eql(
      'Empirial [Phlame (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Building(12, 1, 100%), Building(3, 1, 100%), Building(0, 1, 50%), Building(2, 1, 100%)]',
    );
  });
});
