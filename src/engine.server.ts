import { injectable, inject, Injector } from '@joist/di';
import { Zeit, Zeitgeber } from './app/signals/zeitgeber';
import { Debug } from './app/debug.element';

@injectable
export class EngineService {
  #logger = inject(Debug);
  #zeit = inject(Zeitgeber);

  get time(): Zeit {
    const zeit = this.#zeit();
    this.#logger().log('Tick', zeit.tick, zeit.time);
    return zeit;
  }

  start() {
    const zeit = this.#zeit();
    this.#logger().log('Start', zeit.tick, zeit.time);
    zeit.start();
  }
}

/**
 * TODO? this probably won't stay Singleton
 * One injector per open socket?
 * Injector lifetime?
 */
export const engineInjector = new Injector();
engineInjector.get(EngineService).start();
