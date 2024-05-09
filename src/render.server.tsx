import { raw } from 'hono/html';
import { appToJSX } from './app/app.element';
import { defaultLang, I18n, Language, useTranslations } from './app/i18n';
import { engineInjector, EngineService } from './engine.server';
import { Injector } from '@joist/di';

const AppRoot = (
  t: I18n,
  title: string,
  tick: number,
  time = Date.now(),
  language: Language = defaultLang,
) => (
  <>
    <app-root lang={language}>{appToJSX(t, title, tick, time, language)}</app-root>
  </>
);

export class GameRenderer {
  static TITLE_PLACEHOLDER = '<!-- inject title here -->';
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';

  render(i: Injector, htmlFrame: string, title: string, lang: Language): string {
    const t = useTranslations(lang);

    const engine = i.get(EngineService);
    const zeit = engine.time;

    return htmlFrame
      .replace(GameRenderer.TITLE_PLACEHOLDER, title)
      .replace(
        GameRenderer.APP_ROOT_PLACEHOLDER,
        raw(AppRoot(t, title, zeit.tick, zeit.time, lang)),
      );
  }
}
