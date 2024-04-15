import { raw } from 'hono/html';
import './clock.element.css';
import './percent.element.css';

export function runClock(node: HTMLElement) {
  const setProperty = (name: string, delay: number) => node.style.setProperty(name, `${delay}s`);
  const time = new Date();
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

export class ClockElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const html = Clock();
    this.innerHTML = raw(html);
    runClock(this);
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
