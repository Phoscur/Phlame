import { injectable } from '@joist/di';

export class Debug {
  log(..._values: any[]) {
    // noop, uncomment to get ALL debug logs
    // console.log(...values);
  }
  // high-frequency, per-tick messages (TICKer, resource/entity updates); muted by default
  trace(..._values: any[]) {
    // noop
  }
}

export class ConsoleDebug extends Debug {
  // flip to true to also get the per-tick trace flood
  verbose = false;
  log(...values: any[]) {
    console.log(...values);
  }
  trace(...values: any[]) {
    if (this.verbose) console.log(...values);
  }
}

@injectable({ providers: [[Debug, { use: ConsoleDebug }]] })
export class DebugCtx extends HTMLElement {}

// IMPORTANT: needs to be defined *before* other custom elements be recognised as parent
// customElements.define('debug-ctx', DebugCtx);

/*
import { injectable, inject } from '@joist/di';

@injectable()
class MyElement extends HTMLElement {
  #logger = inject(Debugger);

  connectedCallback() {
    const logger = this.#logger();

    logger.log('MyElement connected!');
  }
}

customElements.define('my-element', MyElement);
*/
