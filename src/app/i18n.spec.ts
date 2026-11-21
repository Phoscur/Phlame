import { describe, expect, it } from 'vitest';
import { useTranslations } from './i18n';

describe('i18n queue countdown', () => {
  it('translates remaining ticks in English', () => {
    const t = useTranslations('en');
    expect(t('building.queue.remaining', 1)).toBe('in 1 tick');
    expect(t('building.queue.remaining', 5)).toBe('in 5 ticks');
    expect(t('building.queue.completing')).toBe('completing');
    expect(t('building.queue.waiting')).toBe('waiting for resources');
  });

  it('translates remaining ticks in German', () => {
    const t = useTranslations('de');
    expect(t('building.queue.remaining', 1)).toBe('in 1 Tick');
    expect(t('building.queue.remaining', 5)).toBe('in 5 Ticks');
    expect(t('building.queue.completing')).toBe('wird fertig');
    expect(t('building.queue.waiting')).toBe('wartet auf Rohstoffe');
  });
});
