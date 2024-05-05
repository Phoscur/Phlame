import { raw } from 'hono/html';
import { inject, injectable } from '@joist/di';
import { Zeitgeber } from '../signals/zeitgeber';
import { Debug } from '../debug.element';
import type { PercentElement } from './percent.element';

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
  static observedAttributes = [];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);

  connectedCallback() {
    const zeit = this.#zeit();
    const logger = this.#logger();

    const html = Tick();
    this.innerHTML = raw(html);

    const content = this.getElementsByClassName('tick')[0] as HTMLElement;
    const percent = this.getElementsByTagName('app-percent')[0] as PercentElement;
    percent.setAttribute('speedms', `${zeit.msPerIteration}`);
    content.style.setProperty('transition', `--tick ${zeit.msPerIteration}ms`);

    zeit.effect(() => {
      const passed = zeit.passed;
      //percent.setAttribute('value', `${passed <= 0.01 ? 0.1 : passed}`); // rather show 10 than 0
      percent.setAttribute('value', `${passed}`);
      //logger.log('ITER', zeit.iteration);
    });
    zeit.effect(() => {
      content.style.setProperty('--tick', `${zeit.tick}`);
      content.innerHTML = `[${zeit.tick}]`;
      logger.log('TICK', zeit.tick);
    });
  }
}
