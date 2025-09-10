import { raw } from 'hono/html';
import type { FC } from 'hono/jsx';
import { App, AppProps } from './app/app.element';
import { Language, useTranslations } from './app/i18n';
import { EngineService } from './engine.server';
import { Injector } from '@joist/di';

const AppRoot: FC<AppProps> = ({ t, title, empire, tick, time, language, environment }) => (
  <>
    <app-root lang={language}>
      {App({ t, title, empire, tick, time, language, environment })}
    </app-root>
  </>
);

export class GameRenderer {
  static TITLE_PLACEHOLDER = '<!-- inject title here -->';
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';

  constructor(public readonly environment: string) {}

  render(i: Injector, htmlFrame: string, title: string, language: Language): string {
    const t = useTranslations(language);

    const engine = i.inject(EngineService);
    const { time, tick } = engine.time;
    const empire = engine.empire;
    // TODO? empire.update(zeit.tick)
    /* for (const entity of empire.entities) {
      entity.update(tick);
    } */
    // console.log('Render', zeit.tick, empire.toString());

    return htmlFrame
      .replace(GameRenderer.TITLE_PLACEHOLDER, title)
      .replace(
        GameRenderer.APP_ROOT_PLACEHOLDER,
        raw(AppRoot({ t, title, empire, tick, time, language, environment: this.environment })),
      );
  }
}
