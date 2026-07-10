import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Economy } from './Economy';
import { Phlame } from './Phlame';
import { Empire } from './Empire';
import examples, { Types } from './resources/examples';
import { phelopments, phormulae } from './examples';
import type { PhelopmentIdentifier } from './Phelopment';
import { ActionTypes } from './Action';

describe('Empire Entity', () => {
  it('should be console printable', () => {
    const empire = new Empire('Empire', []);
    expect(empire.toString()).to.eql('Empire []');
  });

  it('should have resources and phelopments and be serializable', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));

    const eco = new Economy('Eco', stock, phelopments, phormulae);
    const phlame = new Phlame<Types, PhelopmentIdentifier>('Phlame', eco);
    const empire = new Empire('Empirial', [phlame]);
    expect(empire.toString()).to.eql(
      'Empirial [Phlame (Processing energy&resources: 30/50 energy, 0/0 heat, 3salties(0, Infinity): +20, 0blubbs(0, Infinity): 0, 3tumbles(0, Infinity): 0) Phelopment(12, 1, 100%), Phelopment(3, 1, 100%), Phelopment(0, 1, 50%), Phelopment(2, 1, 100%)]',
    );
    expect(empire.toJSON()).to.eql({
      id: 'Empirial',
      entities: [phlame.toJSON()],
      log: [],
    });
  });

  it('should track lastTick across entities', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', stock, phelopments, phormulae);
    const p1 = new Phlame<Types, PhelopmentIdentifier>('Phlame1', eco, [], 10);
    const p2 = new Phlame<Types, PhelopmentIdentifier>('Phlame2', eco, [], 20);
    const empire = new Empire('LastPhlameAhead', [p1, p2]);
    expect(empire.lastTick).to.eql(20);
    // thanks copilot
  });

  it('owns the trusted command log and projects into entities (ADR 0012)', () => {
    const { t3, s3 } = examples;
    const stock = new Stock<Types>(ResourceCollection.fromArray([t3, s3]));
    const eco = new Economy('Eco', stock, phelopments, phormulae);
    const phlame = new Phlame<Types, PhelopmentIdentifier>('P1', eco);
    const empire = new Empire('Empire', [phlame]);

    const entry = empire.enqueue(ActionTypes.UPDATE, { id: 'a1', phelopmentID: 2, grade: 'up' }, [
      phlame,
    ]);
    expect(entry.seq).to.eql(0);
    expect(entry.concerns).to.eql(['P1']);
    expect(empire.log).to.have.lengthOf(1);
    // the projection landed in the concerned entity's queue
    expect(phlame.upcoming).to.have.lengthOf(1);
    expect(phlame.upcoming[0].consequence.payload['id']).to.eql('a1');
    // seq grows strictly monotonic
    const second = empire.enqueue(ActionTypes.UPDATE, { id: 'a2', phelopmentID: 2, grade: 'up' }, [
      phlame,
    ]);
    expect(second.seq).to.eql(1);
    // commands for unknown entities are refused
    const stranger = new Phlame<Types, PhelopmentIdentifier>('Ghost', eco);
    expect(() =>
      empire.enqueue(ActionTypes.UPDATE, { id: 'a3', phelopmentID: 2, grade: 'up' }, [stranger]),
    ).to.throw('Unknown entity: Ghost');
  });
});
