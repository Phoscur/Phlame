import { injectable, inject } from '@joist/di';
import { Debug } from '../debug.element';
import { EmpireService } from './economy';

@injectable
export class EmpireElement extends HTMLElement {
  #logger = inject(Debug);
  #service = inject(EmpireService);

  connectedCallback() {
    const logger = this.#logger();
    const engine = this.#service();

    try {
      const id = 'empire';
      engine.setup(id);
    } catch (ex) {
      console.error(ex);
    }

    logger.log('Empire initialized!');
  }
}
