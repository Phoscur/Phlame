import { describe, expect, it } from 'vitest';
import { ActionFactory } from '@phlame/engine';
import { fromGenesis, genesisFor } from './services';
import type { PhlameEntity } from './factory';
import { phormulae } from './phelopments';

/**
 * The standing M0 invariant (PLAN, ADR 0009/0012): deriving an empire from its genesis
 * and playing the same actions must yield the same state - no matter how the elapsed
 * time is split into update() calls. Lazy realtime (ADR 0002) depends on this: skipping
 * 100 ticks at once must equal 100 single ticks, through waiting queues and all.
 */
const TARGET_TICK = 100;

function genesis() {
  return genesisFor('Determinismus', ['P1']);
}

function playbook(planet: PhlameEntity): PhlameEntity {
  const factory = new ActionFactory();
  // three queued builds at tick 0 - the FIFO Wartefunktion waits, fetches, builds;
  // deterministic action ids, as the engine demands (ADR 0009/0019)
  planet.add(factory.updatePhelopment(4, planet, 'mine-metallic', 'up', 'a1'));
  planet.add(factory.updatePhelopment(8, planet, 'mine-crystalline', 'up', 'a2'));
  planet.add(factory.updatePhelopment(12, planet, 'power-solar', 'up', 'a3'));
  return planet;
}

describe('replay invariant (M0)', () => {
  it('derives the same empire from the same genesis, and refuses foreign universes', () => {
    const [a, b] = [fromGenesis(genesis()), fromGenesis(genesis())];
    expect(JSON.stringify(a.toJSON())).toBe(JSON.stringify(b.toJSON()));
    expect(genesis().universe).toBe(phormulae.phingerprint);
    expect(() => fromGenesis({ ...genesis(), universe: 'deadbeef' })).toThrow(
      'Phingerprint mismatch',
    );
  });

  it('replay ≡ incremental play, any tick split', () => {
    const reference = playbook(fromGenesis(genesis()).entities[0]);
    reference.update(TARGET_TICK);
    const expected = JSON.stringify(reference.toJSON());

    const splits = [
      [1, TARGET_TICK - 1],
      [TARGET_TICK / 2, TARGET_TICK / 2],
      [3, 5, 9, 83], // crossing the queue's wait/start/completion boundaries
      Array.from({ length: TARGET_TICK }, () => 1), // the hardest case: every single tick
    ];
    for (const split of splits) {
      const planet = playbook(fromGenesis(genesis()).entities[0]);
      let tick = 0;
      for (const step of split) {
        tick += step;
        planet.update(tick);
      }
      expect(tick).toBe(TARGET_TICK);
      expect(JSON.stringify(planet.toJSON())).toBe(expected);
    }
  });
});
