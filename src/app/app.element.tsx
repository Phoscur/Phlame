import { inject, injectable } from '@joist/di';
import { defaultLang, I18n, Language, useTranslations } from './i18n';
import {
  BubblesIcon,
  CrystallineIcon,
  EnergyIcon,
  MetallicIcon,
  MineIcon,
  PowerPlantFusionIcon,
  PowerPlantSolarIcon,
  SiloIcon,
} from './icons.svg';
import { Debug } from './debug.element';
import { Zeitgeber } from './signals/zeitgeber';
import { EmpireEntity, EmpireService } from './engine';
import { gameToJSX } from './game.element';
import { render } from 'hono/jsx/dom';

export interface AppProps {
  t: I18n;
  title: string;
  empire: EmpireEntity;
  tick: number;
  time: number;
  language: Language;
  environment: string;
}

export function App({ t, title, empire, tick, time, language, environment }: AppProps) {
  return (
    <>
      <div class="wrapper">
        <zeit-ctx time={time} tick={tick}>
          <div class="flex flex-row-reverse">
            <ph-tick />
            <app-clock />
            <app-i18n-select class="grid" language={language} />
            <app-session class="grid" />
            <ph-tick-slider />
          </div>
          <div class="container mx-auto py-8">
            <div class="text-center mb-6">
              <h1 class="text-2xl font-bold" environment={environment}>
                {t('nav.home')}
              </h1>
            </div>
          </div>

          <debug-ctx>
            <game-ctx>{gameToJSX(t, empire)}</game-ctx>
          </debug-ctx>
        </zeit-ctx>

        <div class="container app-htmx-playground">
          <div id="welcome" class="h-8 mb-16 mx-auto grid grid-flow-col gap-4 auto-cols-max">
            <div class="border-solid border-2 border-sky-500 text-metallic">{MetallicIcon()}</div>
            <div class="border-solid border-2 border-sky-500 text-crystalline-dark">
              {CrystallineIcon()}
            </div>
            <div class="border-solid border-2 border-sky-500 text-liquid">{BubblesIcon()}</div>
            <div class="border-solid border-2 border-sky-500 text-energy-dark">{EnergyIcon()}</div>
            <div>{MineIcon()}</div>
            <div>{SiloIcon()}</div>
            <div>{PowerPlantSolarIcon()}</div>
            <div>{PowerPlantFusionIcon()}</div>
          </div>
          <div class="pt-5">
            <h2
              class="ml-5 mt-5 text-xl ring-1 ring-orange-400 hover:bg-orange-800 inline-flex rounded-md px-5 py-5"
              hx-get="/sum"
              hx-swap="outerHTML"
            >
              {title} 👋 {t('nav.planet')}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}

export class TranslationProvider {
  #lang: Language = defaultLang;
  translate: I18n = useTranslations(this.#lang);
  set(lang: Language): boolean {
    if (lang === this.#lang) {
      return false;
    }
    this.#lang = lang;
    this.translate = useTranslations(this.#lang);
    return true;
  }
}

//@injectable({ providers: [[Debug, { use: ConsoleDebug }]] })
@injectable()
export class AppElement extends HTMLElement {
  static observedAttributes = ['lang'];
  #logger = inject(Debug);
  #i18n = inject(TranslationProvider);
  #empire = inject(EmpireService);
  #zeit = inject(Zeitgeber);
  #cleanup = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

  get environment() {
    // well it's not unnecessary for testing
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.getElementsByTagName('h1')[0]?.attributes.getNamedItem('environment')?.value ?? '';
  }

  get game() {
    return this.getElementsByTagName('game-ctx')[0] as HTMLElement;
  }

  connectedCallback() {
    const logger = this.#logger();
    const zeit = this.#zeit();
    const destroyHold = zeit.effect(() => {
      if (!zeit.holdingTick) return;
      logger.log('TICK hold', zeit.holdingTick);
      const i18n = this.#i18n();

      const empire = this.#empire().restoreFromBackup().current;
      render(gameToJSX(i18n.translate, empire), this.game);
    });
    this.#cleanup = () => {
      destroyHold();
    };
    logger.log('AppElement connected!', this.environment);
  }

  disconnectedCallback() {
    this.#cleanup();
    this.#logger().log('AppElement disconnected!');
  }

  attributeChangedCallback(name = 'lang', oldValue: string, newValue: string) {
    if (name !== 'lang' || !newValue) {
      return;
    }
    // TODO! revert after https://github.com/joist-framework/joist/issues/1276
    //const logger = this.#logger();
    const logger = console;
    const i18n = this.#i18n();
    const updated = i18n.set(newValue as Language);
    if (!updated || !oldValue) {
      logger.log('App I18n:', newValue, '[no update]');
      return;
    }
    logger.log('App I18n:', newValue, '[updated], previously', oldValue);
    const { tick, time } = this.#zeit();
    const empire = this.#empire().current;
    const environment = this.environment + '-clientside';
    const title = `Phlame [${environment}]`;
    // this.innerHTML = raw(App({t: i18n.translate,title,empire,tick,time,language: newValue as Language,environment,}));
    // render will properly bind functions like logout
    // TODO? re-init htmx
    render(
      <App
        t={i18n.translate}
        title={title}
        empire={empire}
        tick={tick}
        time={time}
        language={newValue as Language}
        environment={environment}
      />,
      this,
    );
    logger.log('App Update:', title, tick, newValue);
  }
}
