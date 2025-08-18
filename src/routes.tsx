import type { Hono } from 'hono';
//import { planetToJSX } from './app/planet.element';
//import { useTranslations, defaultLang } from './app/i18n';

export function createRoutes(app: Hono) {
  //const t = useTranslations(defaultLang);
  //app.get('/economy', (c) => c.html(planetToJSX(t, planet)));
  return app;
}
