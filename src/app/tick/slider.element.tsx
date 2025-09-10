import { raw } from 'hono/html';
import { inject, injectable } from '@joist/di';
import { Zeitgeber } from '../signals/zeitgeber';
import { Debug } from '../debug.element';
import { EmpireService } from '../engine';

export const Slider = () => (
  <>
    <div class="grid flex-row mr-5">
      <input
        id="tick-range"
        type="range"
        value="100"
        class="tickRange w-full h-2 mt-10 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      <label
        for="tick-range"
        class="block text-center mt-2 text-sm font-medium text-gray-900 dark:text-white"
      >
        <span class="tick font-bold text-4xl p-4" style="transition: --tick 1s">
          [-1]
        </span>
        <button
          class="playPause w-30 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
          type="button"
        >
          PlayPause
        </button>
      </label>
    </div>
  </>
);

@injectable()
export class TickSliderElement extends HTMLElement {
  static observedAttributes = [];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);
  #empire = inject(EmpireService);
  #cleanup = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
  onHold = false;

  connectedCallback() {
    const zeit = this.#zeit();
    const logger = this.#logger();
    const empire = this.#empire();

    const html = Slider();
    this.innerHTML = raw(html);

    const content = this.getElementsByClassName('tick')[0] as HTMLElement;
    content.style.setProperty('transition', `--tick ${zeit.msPerIteration}ms`);
    const setTick = (tick: number) => {
      content.style.setProperty('--tick', `${tick}`);
      content.innerHTML = `[${tick}]`;
    };

    const range = this.getElementsByClassName('tickRange')[0] as HTMLInputElement;
    logger.log('TickRange LastTick', empire.current.lastTick);
    range.min = `${empire.current.lastTick}`; // TODO get last action tick
    range.max = `${zeit.tick}`;

    range.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      zeit.hold(Number(target.value));
      this.onHold = true;
      //setTick(Number(target.value));
      logger.log('TickRange', target.value, '(paused)');
    };

    const playPause = this.getElementsByClassName('playPause')[0] as HTMLButtonElement;
    playPause.onclick = () => {
      if (zeit.running) zeit.stop();
      else {
        zeit.start();
        this.onHold = false;
      }
    };

    const destroyTick = zeit.effect(() => {
      setTick(zeit.tick);
      if (!this.onHold) range.max = `${zeit.tick}`;
      range.value = `${zeit.tick}`;
      logger.log('TICKer', zeit.tick);
    });
    this.#cleanup = () => {
      destroyTick();
    };
  }

  disconnectedCallback() {
    this.#cleanup();
    this.#logger().log('TickSliderElement disconnected!');
  }
}
