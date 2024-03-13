import './app/app.element';
import './app/planet.element';
import htmx from 'htmx.org';
htmx.on('htmx:load', (e: Event) => {
  console.log('htmx:load', e);
});
