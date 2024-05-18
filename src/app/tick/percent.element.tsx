import { raw } from 'hono/html';
import './percent.element.css';

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

    const value = this.attributes.getNamedItem('value')?.value ?? `${Math.random()}`;

    const percent = this.getElementsByClassName('percent')[0] as HTMLElement;
    percent.style.setProperty('--percent', value);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    const percent = this.getElementsByClassName('percent')[0] as HTMLElement|undefined;
    if (!percent) {
      return;
    }
    if (name === 'value') {
      percent.style.setProperty('--percent', newValue);
    }
    if (name === 'speedms') {
      percent.style.setProperty('transition', `--percent ${newValue}ms linear`);
    }
  }
}

/*
const genNumber = () => {
  document.querySelector("div").style.setProperty("--percent", Math.random());
};

setInterval(genNumber, 2000);
setTimeout(genNumber);
*/

/*
based on the example from https://css-tricks.com/animating-number-counters/
*/
