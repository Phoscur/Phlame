import htmx from 'htmx.org';
import { DOMInjector } from '@joist/di';
import { AppElement } from './app.element';
import { ConsoleDebug, Debug, DebugCtx } from './debug.element';
import { GameContextElement } from './game.element';
import { EmpireElement, PhlameElement } from './engine/empire.element';
import {
  ClockElement,
  PercentElement,
  TickElement,
  TickSliderElement,
  ZeitContextElement,
} from './tick';
import { PlanetElement } from './planet.element';
import { ResourceElement, ResourcesElement } from './resources.element';
import { LanguageSelectDropdownElement } from './language.dropdown.element';
import { ModalElement } from './modal.element';
import { SessionDropdownElement } from './session.element';

function main() {
  const app = new DOMInjector({ providers: [[Debug, { use: ConsoleDebug }]] });

  app.attach(document.body);

  customElements.define('debug-ctx', DebugCtx);
  customElements.define('app-root', AppElement);
  customElements.define('zeit-ctx', ZeitContextElement);
  customElements.define('game-ctx', GameContextElement);
  customElements.define('empire-ctx', EmpireElement);
  customElements.define('ph-ctx', PhlameElement);
  customElements.define('app-i18n-select', LanguageSelectDropdownElement);
  customElements.define('app-session', SessionDropdownElement);
  customElements.define('app-clock', ClockElement);
  customElements.define('app-percent', PercentElement);
  customElements.define('app-modal', ModalElement);
  customElements.define('ph-tick', TickElement);
  customElements.define('ph-tick-slider', TickSliderElement);
  customElements.define('ph-planet', PlanetElement);
  customElements.define('ph-resource', ResourceElement);
  customElements.define('ph-resources', ResourcesElement);

  htmx.on('htmx:load', (e: Event) => {
    console.log('htmx:load', e);
  });
}

main();
