import { Signal } from 'signal-polyfill';
import { effect } from './effect';

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

  /**
   * Trigger an effect on signal change
   */
  public effect = effect;
  /**
   * Derive a Computed time or tick change-aware Signal
   */
  public compute = Signal.Computed;

  constructor(
    private currentTick = 0,
    public readonly msPerTick = 1000,
    public readonly msPerIteration = 1000,
    public readonly timeSource = () => Date.now(),
    private currentTime = timeSource(),
    private setTimeout: TimeoutQueueFunction = window.setTimeout.bind(window),
    private clearTimeout: (tid: number) => void = window.clearTimeout.bind(window),
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

  get next(): number {
    return this.time + this.msPerTick;
  }

  get running() {
    return !!this.timeoutId;
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
    if (this.timeoutId) {
      this.clearTimeout(this.timeoutId);
    }
  }
}
