import { raw } from 'hono/html';
import { injectable, inject } from '@joist/di';
import './clock.element.css';
import './percent.element.css';
import './tick.element.css';
import { Debug } from './debug.element';
import { Zeitgeber } from './signals/zeitgeber';

export function runClock(node: HTMLElement, time: Date) {
  const setProperty = (name: string, delay: number) => node.style.setProperty(name, `${delay}s`);
  const hours = time.getHours() * 3600;
  const minutes = time.getMinutes() * 60;
  const seconds = time.getSeconds();

  setProperty('--delay-hours', -Math.abs(hours + minutes + seconds));
  setProperty('--delay-minutes', -Math.abs(minutes + seconds));
  setProperty('--delay-seconds', -Math.abs(seconds));
}

export const Clock = () => (
  <>
    <ol class="clock">
      <li></li>
      <li></li>
      <li></li>
    </ol>
  </>
);

@injectable
export class ClockElement extends HTMLElement {
  public static observedAttributes = [];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);

  connectedCallback() {
    const html = Clock();
    this.innerHTML = raw(html);
    const time = this.#zeit().time;
    runClock(this, new Date(time));
    this.#logger().log('tick', time);
  }
}

// inspired by https://dev.to/madsstoumann/clocks-countdowns-timing-in-css-and-javascript-554n

export const Percent = () => (
  <>
    <span class="percent"></span>
  </>
);

export class PercentElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const html = Percent();
    this.innerHTML = raw(html);

    const percent = this.getElementsByClassName('percent')[0] as HTMLElement;
    percent.style.setProperty('--percent', `${Math.random()}`);
  }
}

export const Tick = () => (
  <>
    <span class="tick"></span>
  </>
);

@injectable
export class TickElement extends HTMLElement {
  public static observedAttributes = [];
  #logger = inject(Debug);
  zeit = inject(Zeitgeber);

  connectedCallback() {
    const html = Tick();
    this.innerHTML = raw(html);

    const zeit = this.zeit();
    const logger = this.#logger();

    zeit.effect(() => {
      const content = this.getElementsByClassName('tick')[0] as HTMLElement;
      content.style.setProperty('--tick', `${zeit.tick}`);
      logger.log('TICK', zeit.tick);
    });

    setTimeout(() => {
      if (!zeit.running) {
        zeit.start();
      }
    }, 1000);
  }
}
