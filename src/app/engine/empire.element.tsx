import { injectable, inject } from '@joist/di';
import { Debug } from '../debug.element';
import { EconomyService, EmpireService } from './services';

@injectable()
export class EmpireElement extends HTMLElement {
  #logger = inject(Debug);
  #service = inject(EmpireService);

  connectedCallback() {
    const logger = this.#logger();
    const engine = this.#service();

    try {
      const id = this.attributes.getNamedItem('id')?.value ?? 'Unknown Empire';
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      const entities = JSON.parse(this.attributes.getNamedItem('entities')?.value ?? '[]');
      logger.log(`Empire[${id}] initializing...`, entities);
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      engine.setupFromJSON({ id, entities });
    } catch (ex) {
      console.error(ex);
    }
  }
}

@injectable({ providers: [[EconomyService, { use: EconomyService }]] }) // force a new instance for each element, economy service is not reusable
export class PhlameElement extends HTMLElement {
  #logger = inject(Debug);
  #service = inject(EconomyService);

  connectedCallback() {
    const logger = this.#logger();
    const service = this.#service();

    try {
      const id = this.attributes.getNamedItem('id')?.value ?? 'Unknown Phlame';
      logger.log(`Phlame[${id}] initializing...`);
      service.setup(id);
    } catch (ex) {
      console.error(ex);
    }
  }
}
