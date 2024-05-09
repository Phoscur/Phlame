import { raw } from 'hono/html';
import { appToJSX } from './app/app.element';
import { defaultLang, I18n, Language, useTranslations } from './app/i18n';

const AppRoot = (
  t: I18n,
  title: string,
  tick: number,
  language: Language = defaultLang,
  time = Date.now(),
) => (
  <>
    <app-root lang={language}>{appToJSX(t, title, tick, language, time)}</app-root>
  </>
);

export class GameRenderer {
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';
  constructor(readonly htmlFrame: string, readonly title: string, readonly lang: Language) {}

  render(): string {
    const tick = 42;
    const t = useTranslations(this.lang);
    return this.htmlFrame.replace(
      GameRenderer.APP_ROOT_PLACEHOLDER,
      raw(AppRoot(t, this.title, tick, this.lang)),
    );
  }
}
