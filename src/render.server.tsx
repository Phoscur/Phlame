import { raw } from 'hono/html';
import { appToJSX } from './app/app.element';
import { defaultLang, I18n, Language, useTranslations } from './app/i18n';
import { EngineService } from './engine.server';
import { Injector } from '@joist/di';
import { EmpireEntity } from './app/engine';

const AppRoot = (
  t: I18n,
  title: string,
  empire: EmpireEntity,
  tick: number,
  time = Date.now(),
  language: Language = defaultLang,
) => (
  <>
    <app-root lang={language}>{appToJSX(t, title, empire, tick, time, language)}</app-root>
  </>
);

export class GameRenderer {
  static TITLE_PLACEHOLDER = '<!-- inject title here -->';
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';

  render(i: Injector, htmlFrame: string, title: string, lang: Language): string {
    const t = useTranslations(lang);

    const engine = i.get(EngineService);
    const zeit = engine.time;
    const empire = engine.empire;

    return htmlFrame
      .replace(GameRenderer.TITLE_PLACEHOLDER, title)
      .replace(
        GameRenderer.APP_ROOT_PLACEHOLDER,
        raw(AppRoot(t, title, empire, zeit.tick, zeit.time, lang)),
      );
  }
}
