import htmx from 'htmx.org';
import { DOMInjector } from '@joist/di';
import { AppElement } from './app/app.element';
import { ConsoleDebug, Debug, DebugCtx } from './app/debug.element';
import { GameContextElement } from './app/game.element';
import { EmpireElement, PhlameElement } from './app/engine/empire.element';
import { ClockElement, PercentElement, TickElement, ZeitContextElement } from './app/tick';
import { PlanetElement } from './app/planet.element';
import { ResourceElement, ResourcesElement } from './app/resources.element';
import { LanguageSelectDropdownElement } from './app/language.dropdown.element';

const app = new DOMInjector({ providers: [[Debug, { use: ConsoleDebug }]] });

app.attach(document.body);

customElements.define('debug-ctx', DebugCtx);
customElements.define('app-root', AppElement);
customElements.define('zeit-ctx', ZeitContextElement);
customElements.define('game-ctx', GameContextElement);
customElements.define('empire-ctx', EmpireElement);
customElements.define('ph-ctx', PhlameElement);
customElements.define('app-i18n-select', LanguageSelectDropdownElement);
customElements.define('app-clock', ClockElement);
customElements.define('app-percent', PercentElement);
customElements.define('ph-tick', TickElement);
customElements.define('ph-planet', PlanetElement);
customElements.define('ph-resource', ResourceElement);
customElements.define('ph-resources', ResourcesElement);

htmx.on('htmx:load', (e: Event) => {
  console.log('htmx:load', e);
});
