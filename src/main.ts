import htmx from 'htmx.org';
import { AppElement } from './app/app.element';
import { DebugCtx } from './app/debug.element';
import { GameElement } from './app/game.element';
import { EmpireElement, PhlameElement } from './app/engine/empire.element';
import { ClockElement, PercentElement, TickElement, ZeitElement } from './app/tick';
import { PlanetElement } from './app/planet.element';
import { EnergyElement, ResourceElement, ResourcesElement } from './app/resources.element';

customElements.define('debug-ctx', DebugCtx);
customElements.define('zeit-ctx', ZeitElement);
customElements.define('game-ctx', GameElement);
customElements.define('empire-ctx', EmpireElement);
customElements.define('ph-ctx', PhlameElement);
customElements.define('app-root', AppElement);
customElements.define('app-clock', ClockElement);
customElements.define('app-percent', PercentElement);
customElements.define('ph-tick', TickElement);
customElements.define('ph-planet', PlanetElement);
customElements.define('ph-resource', ResourceElement);
customElements.define('ph-energy', EnergyElement);
customElements.define('ph-resources', ResourcesElement);

htmx.on('htmx:load', (e: Event) => {
  console.log('htmx:load', e);
});
