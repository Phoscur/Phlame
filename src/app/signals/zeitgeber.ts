import { Signal } from 'signal-polyfill';
import { effect } from './effect';

type TimeoutQueueFunction = (callback: () => void, ms: number) => number;

export class Zeit {
  readonly tick: number = 0;
  readonly time: number = 0;
}

/**
 * The time-giver
 * takes care of time and tick cycles
 */
export class Zeitgeber implements Zeit {
  private zeitgeist: {
    tick: Signal.State<number>;
    time: Signal.State<number>;
    iteration: Signal.State<number>;
  };
  private timeoutId?: number;

  /**
   * Trigger an effect on signal change
   */
  public effect = effect;
  /**
   * Derive a Computed time or tick change-aware Signal
   */
  public Computed = Signal.Computed;

  constructor(
    private currentTick = 0,
    public readonly msPerTick = 10000,
    public readonly msPerIteration = 334,
    public readonly timeSource = () => Date.now(),
    private currentTime = timeSource(),
    private setTimeout: TimeoutQueueFunction = window.setTimeout.bind(window),
    private clearTimeout: (tid: number) => void = window.clearTimeout.bind(window),
  ) {
    this.zeitgeist = {
      tick: new Signal.State(currentTick),
      time: new Signal.State(currentTime),
      iteration: new Signal.State(currentTime),
    };
  }

  /**
   * Current Game Tick (Signal)
   */
  get tick(): number {
    return this.zeitgeist.tick.get();
  }

  /**
   * Current Game Time at Tick (Signal)
   */
  get time(): number {
    return this.zeitgeist.time.get();
  }

  /**
   * Current Iteration Time (Signal)
   */
  get iteration(): number {
    return this.zeitgeist.iteration.get();
  }

  /**
   * Current Game Time at Tick (bypassing Signals)
   */
  get now() {
    return this.currentTime;
  }

  /**
   * Game Time at next Tick (using time Signal)
   */
  get next(): number {
    return this.time + this.msPerTick;
  }

  /**
   * Percentage of time passed until next Tick (using iteration time Signal)
   */
  get passed(): number {
    return (this.iteration - this.currentTime) / this.msPerTick;
  }

  get running() {
    return !!this.timeoutId;
  }

  private timeloop() {
    const now = this.timeSource();
    this.zeitgeist.iteration.set(now);
    const diff = now - this.currentTime;
    const ticks = Math.floor(diff / this.msPerTick);
    this.currentTime += ticks * this.msPerTick;
    this.zeitgeist.time.set(this.currentTime);
    this.currentTick += ticks;
    this.zeitgeist.tick.set(this.currentTick);

    this.timeoutId = this.setTimeout(() => this.timeloop(), this.msPerIteration);
  }

  start(time?: number, tick?: number) {
    if (this.running) {
      throw new Error('Stop Zeitgeber before restarting it!');
    }
    if (typeof time !== 'undefined') {
      this.currentTime = time;
      this.zeitgeist.iteration.set(time);
      this.zeitgeist.time.set(time);
    }
    if (typeof tick !== 'undefined') {
      this.currentTick = tick;
      this.zeitgeist.tick.set(tick);
    }
    this.timeloop();
  }

  stop() {
    if (this.timeoutId) {
      this.clearTimeout(this.timeoutId);
    }
  }
}
