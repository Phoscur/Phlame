import { describe, expect, it } from 'vitest';
import { ActionTypes } from '@phlame/engine';
import { useTranslations } from './i18n';
import { planetToJSX } from './planet.element';
import type { PhlameEntity } from './engine';

describe('planetToJSX queue countdown', () => {
  function makeMockPlanet(lastTick: number, completeAts: number[]): PhlameEntity {
    return {
      id: 'P1',
      lastTick,
      productionTable: [],
      toJSON: () => ({ phelopments: [{ type: 'mine-metallic', level: 1 }] }),
      queue: completeAts.map((completeAt, idx) => ({
        action: {
          type: ActionTypes.UPDATE,
          consequence: {
            payload: {
              id: `action-${idx}`,
              phelopmentID: 'mine-metallic',
              grade: 'up' as const,
            },
          },
        },
        completeAt,
      })),
    } as unknown as PhlameEntity;
  }

  it('renders countdown for 1 tick, several ticks, 0 (completing), and Infinity (waiting)', () => {
    const t = useTranslations('en');
    const planet = makeMockPlanet(100, [101, 105, 100, 98, Infinity]);
    const html = planetToJSX(t, planet).toString();

    expect(html).toContain('(in 1 tick)');
    expect(html).toContain('(in 5 ticks)');
    expect(html).toContain('(completing)');
    expect(html).toContain('(waiting for resources)');
  });

  it('renders countdown in German', () => {
    const t = useTranslations('de');
    const planet = makeMockPlanet(100, [101, 105, 100, Infinity]);
    const html = planetToJSX(t, planet).toString();

    expect(html).toContain('(in 1 Tick)');
    expect(html).toContain('(in 5 Ticks)');
    expect(html).toContain('(wird fertig)');
    expect(html).toContain('(wartet auf Rohstoffe)');
  });
});
