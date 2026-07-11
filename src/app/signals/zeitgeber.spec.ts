import { describe, expect, it } from 'vite-plus/test';
import { Signal } from 'signal-polyfill';
import { Zeitgeber } from './zeitgeber';
import { effect } from './effect';

/**
 * Deterministic harness: fake time source & fake timer queue,
 * both injected via the Zeitgeber constructor - no real sleeps, no flaky timing.
 */
function fakeZeit(msPerTick = 10, startTime = 1714304619612) {
  let now = startTime;
  let timerId = 0;
  const timers = new Map<number, () => void>();
  const zeit = new Zeitgeber(
    0,
    msPerTick,
    msPerTick,
    () => now,
    now,
    (callback: () => void) => {
      timers.set(++timerId, callback);
      return timerId;
    },
    (tid: number) => timers.delete(tid),
  );
  return {
    zeit,
    /** Advance fake time and fire due timer callbacks (one iteration), then let effects process */
    async elapse(ms: number) {
      now += ms;
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((callback) => callback());
      // effect() batches via queueMicrotask - let pending microtasks run
      await Promise.resolve();
    },
  };
}

describe('Zeitgeber', () => {
  it('should count', async () => {
    const ms = 10;
    const { zeit, elapse } = fakeZeit(ms);
    let computed;
    const computing = new Signal.Computed(() => (computed = zeit.tick));

    expect(zeit.tick).toBe(0);
    expect(zeit.timeMS).toBe(1714304619612);
    expect(computed).toBe(undefined);
    computing.get();
    expect(computed).toBe(0);

    zeit.start();
    await elapse(ms + ms / 2);

    // only one, not one and a half ticks have passed
    expect(zeit.timeMS).toBe(1714304619622);
    expect(zeit.tick).toBe(1);
    computing.get();
    expect(computed).toBe(1);

    zeit.stop();
    expect(zeit.running).toBe(false);
  });

  it('should catch up skipped ticks in a single iteration', async () => {
    const ms = 10;
    const start = 1714304619612;
    const { zeit, elapse } = fakeZeit(ms, start);

    zeit.start();
    // three and a half tick intervals pass before the next iteration fires (lazy catch-up)
    await elapse(3 * ms + ms / 2);

    expect(zeit.tick).toBe(3);
    expect(zeit.timeMS).toBe(start + 3 * ms);

    // the remaining half interval completes the fourth tick
    await elapse(ms / 2);
    expect(zeit.tick).toBe(4);
    expect(zeit.timeMS).toBe(start + 4 * ms);

    zeit.stop();
  });

  it('should signal on effect', async () => {
    const ms = 10;
    const { zeit, elapse } = fakeZeit(ms);
    let computed: number | undefined;
    const cleanUp = effect(() => {
      computed = zeit.tick;
      return () => {
        // clean up
      };
    });

    expect(zeit.tick).toBe(0);
    expect(zeit.timeMS).toBe(1714304619612);
    expect(computed).toBe(0);

    zeit.start();
    await elapse(ms + ms / 2);

    expect(zeit.timeMS).toBe(1714304619622);
    expect(zeit.tick).toBe(1);
    expect(computed).toBe(1);

    zeit.stop();
    cleanUp();
  });

  it('should hold the tick signal and resume', async () => {
    const ms = 10;
    const { zeit, elapse } = fakeZeit(ms);

    zeit.start();
    await elapse(2 * ms);
    expect(zeit.tick).toBe(2);

    // time travel back for debugging (TickSlider): signals show the held tick
    zeit.hold(1);
    expect(zeit.running).toBe(false);
    expect(zeit.tick).toBe(1);
    expect(zeit.holdingTick).toBe(1);

    // resuming restores the actual tick and continues counting
    zeit.start();
    expect(zeit.running).toBe(true);
    expect(zeit.holdingTick).toBe(0);
    expect(zeit.tick).toBe(2);

    await elapse(ms);
    expect(zeit.tick).toBe(3);

    zeit.stop();
  });
});
