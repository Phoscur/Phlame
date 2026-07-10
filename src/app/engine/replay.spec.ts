import { describe, expect, it } from 'vitest';
import { ActionTypes } from '@phlame/engine';
import { fromGenesis, genesisFor } from './services';
import type { EmpireEntity } from './factory';
import { phormulae } from './phelopments';

/**
 * The standing M0 invariant (PLAN, ADR 0009/0012/0018): deriving an empire from its
 * genesis and applying the command log must equal incremental play - for any tick
 * split, through the waiting build queue. Lazy realtime (ADR 0002) depends on this:
 * skipping 100 ticks at once must equal 100 single ticks.
 */
const TARGET_TICK = 100;

function genesis() {
  return genesisFor('Determinismus', ['P1']);
}

function enqueueGrade(empire: EmpireEntity, id: string, type: string, at?: number) {
  const [planet] = empire.entities;
  return empire.enqueue(
    ActionTypes.UPDATE,
    { id, phelopmentID: type, grade: 'up' },
    [planet],
    at,
  );
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
    const playbook = (empire: EmpireEntity) => {
      // three queued builds at tick 0 - the FIFO Wartefunktion waits, fetches, builds
      enqueueGrade(empire, 'a1', 'mine-metallic');
      enqueueGrade(empire, 'a2', 'mine-crystalline');
      enqueueGrade(empire, 'a3', 'power-solar');
      return empire;
    };
    const reference = playbook(fromGenesis(genesis()));
    reference.update(TARGET_TICK);
    const expected = JSON.stringify(reference.toJSON());

    const splits = [
      [1, TARGET_TICK - 1],
      [TARGET_TICK / 2, TARGET_TICK / 2],
      [3, 5, 9, 83], // crossing the queue's wait/start/completion boundaries
      Array.from({ length: TARGET_TICK }, () => 1), // the hardest case: every single tick
    ];
    for (const split of splits) {
      const empire = playbook(fromGenesis(genesis()));
      let tick = 0;
      for (const step of split) {
        tick += step;
        empire.update(tick);
      }
      expect(tick).toBe(TARGET_TICK);
      expect(JSON.stringify(empire.toJSON())).toBe(expected);
    }
  });

  it('replay(genesis, log) ≡ interactive play with commands over time (ADR 0012/0018)', () => {
    // an interactive session: commands arrive at different ticks on the shared timeline
    const live = fromGenesis(genesis());
    enqueueGrade(live, 'b1', 'mine-metallic', 0);
    live.update(10);
    enqueueGrade(live, 'b2', 'power-solar', 10);
    live.update(25);
    enqueueGrade(live, 'b3', 'mine-metallic', 25);
    live.update(TARGET_TICK);

    // the authoritative save is genesis + command log; the snapshot is its cache
    const replayed = fromGenesis(genesis()).applyLog(live.log, TARGET_TICK);
    expect(JSON.stringify(replayed.toJSON())).toBe(JSON.stringify(live.toJSON()));
    // including the regenerated consequence echoes - the verifiable echo (ADR 0018)
    expect(replayed.echoes).toEqual(live.echoes);
  });
});
