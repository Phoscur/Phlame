import { raw } from 'hono/html';
import type { FC } from 'hono/jsx';
import { App, AppProps } from './app/app.element';
import { Language, useTranslations } from './app/i18n';
import { EngineService } from './engine.server';
import { Injector } from '@joist/di';

const AppRoot: FC<AppProps> = ({
  t,
  title,
  empire,
  tick,
  timeMS,
  language,
  environment,
  sessionLost,
}) => (
  <>
    <app-root lang={language}>
      {App({ t, title, empire, tick, timeMS, language, environment, sessionLost })}
    </app-root>
  </>
);

export class GameRenderer {
  static TITLE_PLACEHOLDER = '<!-- inject title here -->';
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';

  constructor(public readonly environment: string) {}

  render(
    i: Injector,
    htmlFrame: string,
    title: string,
    language: Language,
    sessionLost = false,
    sessionEmpire?: AppProps['empire'],
  ): string {
    const t = useTranslations(language);

    const engine = i.inject(EngineService);
    const { timeMS, tick } = engine.time;
    // the singleton empire is only the fallback (prod static render, failed loads) -
    // request handlers pass their own session's empire (parallel requests swap the singleton)
    const empire = sessionEmpire ?? engine.empire;
    // TODO? empire.update(zeit.tick)
    /* for (const entity of empire.entities) {
      entity.update(tick);
    } */
    // console.log('Render', zeit.tick, empire.toString());

    return htmlFrame.replace(GameRenderer.TITLE_PLACEHOLDER, title).replace(
      GameRenderer.APP_ROOT_PLACEHOLDER,
      raw(
        AppRoot({
          t,
          title,
          empire,
          tick,
          timeMS,
          language,
          environment: this.environment,
          sessionLost,
        }),
      ),
    );
  }
}
