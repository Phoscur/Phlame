import { Signal } from 'signal-polyfill';
import { Zeitgeber } from './zeitgeber';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
describe('Zeitgeber', () => {
  it('should count', async () => {
    const ms = 10;
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
    fakeNow += ms + ms / 2;
    expect(fakeNow).toBe(1714304619627);
    await sleep(15);
    expect(zeit.time).toBe(1714304619622);
    expect(zeit.tick).toBe(1);
    computing.get();
    expect(computed).toBe(1);
    zeit.stop();
  });
  it('should signal', () => {});
});
