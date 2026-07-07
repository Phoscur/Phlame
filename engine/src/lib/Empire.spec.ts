import { ResourceCollection } from './resources/ResourceCollection';
import { Stock } from './resources/Stock';
import { Economy } from './Economy';
import { Phlame } from './Phlame';
import { Empire } from './Empire';
import examples, { Types } from './resources/examples';
import { phelopments, phormulae } from './examples';
import type { PhelopmentIdentifier } from './Phelopment';
import { ActionFactory, EventFactory } from './Action';

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
      events: [],
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

  it('should add events', () => {
    const empire = new Empire('Empire', []);
    const action = new ActionFactory().createPhelopment(1, empire, 4);
    const event = new EventFactory().fromAction(0, action);
    empire.addEvent(event);
    expect(empire.events).to.have.lengthOf(1);
    expect(empire.events[0]).to.eql(event);
  });
});
