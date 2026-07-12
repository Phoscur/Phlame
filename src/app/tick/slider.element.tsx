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
      <div class="block text-center mt-2 text-sm font-medium text-gray-900 dark:text-white">
        <span class="tick font-bold text-4xl p-4" style="transition: --tick 1s">
          [-1]
        </span>
        <button
          class="playPause w-30 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center"
          type="button"
        >
          PlayPause
        </button>
        <label class="inline-flex items-center cursor-pointer ml-6">
          <input
            type="checkbox"
            class="unrestrictedToggle w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            Timewarp to Genesis
          </span>
        </label>
      </div>
    </div>
  </>
);

@injectable()
export class TickSliderElement extends HTMLElement {
  static observedAttributes = [];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);
  #empire = inject(EmpireService);
  #cleanup = () => {};
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
    const unrestrictedToggle = this.getElementsByClassName(
      'unrestrictedToggle',
    )[0] as HTMLInputElement;

    const updateMin = () => {
      const logLength = empire.current.log.length;

      if (unrestrictedToggle.checked) {
        range.min = '0';
      } else {
        // allow timewarping backwards only until the last queued action
        const lastActionTick = logLength > 0 ? empire.current.log[logLength - 1].tick : 0;

        range.min = `${lastActionTick}`;

        // If they toggle strict mode back on and their current slider value is now too low, pull them forward
        if (Number(range.value) < Number(range.min)) {
          range.value = range.min;
          if (this.onHold) {
            zeit.hold(Number(range.value));
          }
        }
      }
    };

    unrestrictedToggle.onchange = () => updateMin();
    updateMin();
    range.max = `${zeit.tick}`;

    range.oninput = (event: Event) => {
      updateMin();
      const target = event.target as HTMLInputElement;
      zeit.hold(Number(target.value));
      this.onHold = true;
      //setTick(Number(target.value));
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
      updateMin();
      setTick(zeit.tick);
      if (!this.onHold) range.max = `${zeit.tick}`;
      range.value = `${zeit.tick}`;
      logger.trace('TICKer', zeit.tick);
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
