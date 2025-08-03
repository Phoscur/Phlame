import { injectable, inject } from '@joist/di';
import { Debug } from '../debug.element';
import { Zeitgeber } from '../signals/zeitgeber';

/**
 * Time/Tick Context: Zeitgeber start
 */
@injectable()
export class ZeitContextElement extends HTMLElement {
  static observedAttributes = [];
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);

  connectedCallback() {
    const time = Number(this.attributes.getNamedItem('time')?.value) || Date.now();
    const tick = Number(this.attributes.getNamedItem('tick')?.value) || 0;

    this.#zeit().start(time, tick);
    this.#logger().log('Zeit Ctx connected, start!', time, tick);
  }
}
