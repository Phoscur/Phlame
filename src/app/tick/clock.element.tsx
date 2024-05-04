import { raw } from 'hono/html';
import { injectable, inject } from '@joist/di';
import { Zeitgeber } from '../signals/zeitgeber';
import { Debug } from '../debug.element';
import './clock.element.css';

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
    this.#logger().log('CLOCK', time);
  }

  // does not require updates/effects - relies on css transitions only (does not work in Firefox for now)
  // TODO? use effect only for Firefox
}

// inspired by https://dev.to/madsstoumann/clocks-countdowns-timing-in-css-and-javascript-554n
