import htmx from 'htmx.org';
import { AppElement } from './app/app.element';
import { PlanetElement } from './app/planet.element';
import { ClockElement, PercentElement } from './app/clock.element';
import { EnergyElement, ResourceElement, ResourcesElement } from './app/resources.element';

customElements.define('app-root', AppElement);
customElements.define('app-clock', ClockElement);
customElements.define('app-percent', PercentElement);
customElements.define('ph-planet', PlanetElement);
customElements.define('ph-resource', ResourceElement);
customElements.define('ph-energy', EnergyElement);
customElements.define('ph-resources', ResourcesElement);

htmx.on('htmx:load', (e: Event) => {
  console.log('htmx:load', e);
});
