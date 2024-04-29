import { Signal } from 'signal-polyfill';

type TimeoutQueueFunction = (callback: () => void, ms: number) => number;

/**
 * The time-giver
 * takes care of time and tick cycles
 */
export class Zeitgeber {
  private zeitgeist: {
    tick: Signal.State<number>;
    time: Signal.State<number>;
  };
  private timeoutId?: number;

  constructor(
    private currentTick = 0,
    public readonly msPerTick = 1000,
    public readonly msPerIteration = 1000,
    public readonly timeSource = () => Date.now(),
    private currentTime = timeSource(),
    private setTimeout: TimeoutQueueFunction = global.setTimeout,
    private clearTimeout = global.clearTimeout,
  ) {
    this.zeitgeist = {
      tick: new Signal.State(currentTick),
      time: new Signal.State(currentTime),
    };
  }

  get tick(): number {
    return this.zeitgeist.tick.get();
  }

  get time(): number {
    return this.zeitgeist.time.get();
  }

  get now() {
    return this.currentTime;
  }

  private timeloop() {
    const now = this.timeSource();
    const diff = now - this.currentTime;
    const ticks = Math.floor(diff / this.msPerTick);
    this.currentTime += ticks * this.msPerTick;
    this.zeitgeist.time.set(this.currentTime);
    this.currentTick += ticks;
    this.zeitgeist.tick.set(this.currentTick);

    this.timeoutId = this.setTimeout(() => this.timeloop(), this.msPerIteration);
  }

  start() {
    this.timeloop();
  }

  stop() {
    this.clearTimeout(this.timeoutId);
  }
}
