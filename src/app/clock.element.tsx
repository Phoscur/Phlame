import { raw } from 'hono/html';
import { injectable, inject } from '@joist/di';
import './clock.element.css';
import './percent.element.css';
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
    <span class="percent grid font-bold text-4xl p-4" style="transition: --percent 250ms"></span>
  </>
);

export class PercentElement extends HTMLElement {
  public static observedAttributes = ['value', 'speedms'];

  connectedCallback() {
    const html = Percent();
    this.innerHTML = raw(html);

    const value = this.attributes.getNamedItem('value')?.value || `${Math.random()}`;

    const percent = this.getElementsByClassName('percent')[0] as HTMLElement;
    percent.style.setProperty('--percent', value);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const percent = this.getElementsByClassName('percent')[0] as HTMLElement;
    if (!percent) {
      return;
    }
    if (name === 'value') {
      percent.style.setProperty('--percent', newValue);
    }
    if (name === 'speedms') {
      percent.style.setProperty('transition', `--percent ${newValue}ms`);
    }
  }
}

export const Tick = () => (
  <>
    <div class="flex flex-row">
      <span class="tick grid font-bold text-4xl p-4" style="transition: --tick 1s">
        [-1]
      </span>
      <app-percent value="0.99" speedms="250"></app-percent>
    </div>
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
      const percent = this.getElementsByTagName('app-percent')[0] as PercentElement;
      const passed = zeit.passed;
      //percent.setAttribute('value', `${passed <= 0.01 ? 0.1 : passed}`); // rather show 10 than 0
      percent.setAttribute('value', `${passed}`);
      percent.setAttribute('speedms', `${zeit.msPerIteration}`);
      content.style.setProperty('--tick', `${zeit.tick}`);
      content.style.setProperty('transition', `--tick ${zeit.msPerIteration}ms`);
      content.innerHTML = `[${zeit.tick}]`;
      logger.log('TICK', zeit.tick, zeit.iteration, passed);
    });

    setTimeout(() => {
      if (!zeit.running) {
        zeit.start();
      }
    }, 1000);
  }
}
