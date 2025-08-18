import { describe, expect, it } from 'vitest';
import { Signal } from 'signal-polyfill';
import { Zeitgeber } from './zeitgeber';
import { effect } from './effect';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
describe('Zeitgeber', () => {
  it('should count', async () => {
    const ms = 10;
    const testIncrementMs = ms + ms / 2;
    const now = 1714304619612;
    let fakeNow = now;
    const timeSource = () => fakeNow;
    const zeit = new Zeitgeber(0, ms, ms, timeSource);
    let computed;
    const computing = new Signal.Computed(() => (computed = zeit.tick));

    expect(zeit.tick).toBe(0);
    expect(zeit.time).toBe(1714304619612);
    expect(computed).toBe(undefined);
    computing.get();
    expect(computed).toBe(0);

    zeit.start();
    fakeNow += testIncrementMs;
    expect(fakeNow).toBe(1714304619627);
    await sleep(testIncrementMs);

    // only one, not one and a half ticks have passed
    expect(zeit.time).toBe(1714304619622);
    expect(zeit.tick).toBe(1);
    computing.get();
    expect(computed).toBe(1);

    zeit.stop();
  });
  it('should signal on effect', async () => {
    const ms = 10;
    const testIncrementMs = ms + ms / 2;
    const now = 1714304619612;
    let fakeNow = now;
    const timeSource = () => fakeNow;
    const zeit = new Zeitgeber(0, ms, ms, timeSource);
    let computed: number | undefined;
    const cleanUp = effect(() => {
      computed = zeit.tick;
      return () => {
        // clean up
      };
    });

    expect(zeit.tick).toBe(0);
    expect(zeit.time).toBe(1714304619612);
    expect(computed).toBe(0);

    zeit.start();
    fakeNow += testIncrementMs;
    expect(fakeNow).toBe(1714304619627);
    await sleep(testIncrementMs);

    expect(zeit.time).toBe(1714304619622);
    expect(zeit.tick).toBe(1);
    expect(computed).toBe(1);

    zeit.stop();
    cleanUp();
  });
});
