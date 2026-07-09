import { describe, expect, it } from 'vitest';
import { GameSession } from './session';
import { phormulae } from '../../src/app/engine/phelopments';

describe('GameSession (console/MCP kit)', () => {
  it('creates a fresh empire and advances deterministically', () => {
    const session = GameSession.create('Test');
    expect(session.tick).toBe(0);
    expect(session.state()).toContain('Empire Test @ tick 0');

    session.advance(100);
    expect(session.tick).toBe(100);
    expect(session.planet().lastTick).toBe(100);
    // time only moves forward
    session.advanceTo(50);
    expect(session.tick).toBe(100);
  });

  it('lists phelopments with costs and build times from the Phormulae', () => {
    const session = GameSession.create('Costs');
    const rows = session.list();
    const mine = rows.find((r) => r.type === 'mine-metallic');
    expect(mine).toBeDefined();
    expect(mine?.level).toBe(1);
    expect(mine?.upgradeCost).toContain('metallic');
    expect(mine?.upgradeTime).toBeGreaterThan(0);
  });

  it('queues an upgrade action whose consequence applies after the build duration', () => {
    const session = GameSession.create('Builder');
    const before = session.list().find((r) => r.type === 'mine-metallic')?.level;
    const { at, duration } = session.grade('mine-metallic', 'up');
    expect(duration).toBeGreaterThan(0);
    expect(at).toBe(duration); // queued at tick 0
    expect(session.upcoming()).toHaveLength(1);

    session.advance(duration - 1);
    expect(session.list().find((r) => r.type === 'mine-metallic')?.level).toBe(before);
    session.advance(1);
    expect(session.list().find((r) => r.type === 'mine-metallic')?.level).toBe((before ?? 0) + 1);
    expect(session.upcoming()).toHaveLength(0);
  });

  it('rejects unknown phelopments and planets with helpful errors', () => {
    const session = GameSession.create('Errors');
    expect(() => session.grade('warp-gate', 'up')).toThrow('Unknown phelopment: warp-gate');
    expect(() => session.planet('Nirvana')).toThrow('Unknown planet: Nirvana');
  });

  it('round-trips through JSON and guards the universe Phingerprint (ADR 0011)', () => {
    const session = GameSession.create('Saver');
    session.grade('mine-crystalline', 'up');
    session.advance(10);

    const save = session.toJSON();
    expect(save.phingerprint).toBe(phormulae.phingerprint);

    const restored = GameSession.fromJSON(save);
    expect(restored.tick).toBe(10);
    expect(restored.state()).toContain('Saver');
    // NOTE: queued (not yet applied) actions are not serialized yet - M1 log work

    expect(() => GameSession.fromJSON({ ...save, phingerprint: 'deadbeef' })).toThrow(
      'Phingerprint mismatch',
    );
  });
});
