import htmx from 'htmx.org';
import { AppElement } from './app/app.element';
import { PlanetElement } from './app/planet.element';
import { ClockElement } from './app/clock.element';

customElements.define('app-root', AppElement);
customElements.define('app-clock', ClockElement);
customElements.define('ph-planet', PlanetElement);

htmx.on('htmx:load', (e: Event) => {
  console.log('htmx:load', e);
});
