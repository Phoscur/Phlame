import { raw } from 'hono/html';
import { appToJSX } from './app/app.element';
import { defaultLang, I18n, Language, useTranslations } from './app/i18n';

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
  constructor(readonly htmlFrame: string, readonly title: string, readonly lang: Language) {}

  render(tick = 42, time = Date.now()): string {
    const t = useTranslations(this.lang);
    return this.htmlFrame
      .replace(GameRenderer.TITLE_PLACEHOLDER, this.title)
      .replace(
        GameRenderer.APP_ROOT_PLACEHOLDER,
        raw(AppRoot(t, this.title, tick, time, this.lang)),
      );
  }
}
