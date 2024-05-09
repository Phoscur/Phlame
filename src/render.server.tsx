import { raw } from 'hono/html';
import { gameToJSX } from './app/game.element';
import { appToJSX } from './app/app.element';
import { I18n } from './app/i18n';

const AppRoot = (t: I18n, title: string, tick: number, time = Date.now()) => (
  <>
    <app-root>{appToJSX(t, title, tick, time)}</app-root>
  </>
);

export class GameRenderer {
  static APP_ROOT_PLACEHOLDER = '<!--inject app-root here -->';
  constructor(readonly htmlFrame: string, readonly title: string, readonly t: I18n) {}

  render(): string {
    return this.htmlFrame.replace(
      GameRenderer.APP_ROOT_PLACEHOLDER,
      raw(AppRoot(this.t, this.title, 42)),
    );
  }
}
