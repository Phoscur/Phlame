import { raw } from 'hono/html';
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
import { inject, injectable } from '@joist/di';
import { Debug } from './debug.element';
import { languageSelectToJSX } from './language.dropdown.element';
import { Zeitgeber } from './signals/zeitgeber';

export const appToJSX = (
  t: I18n,
  title: string,
  tick: number,
  time = Date.now(),
  language: Language = defaultLang,
) => (
  <>
    <zeit-ctx time={time} tick={tick}>
      <div class="wrapper">
        <div class="flex flex-row-reverse">
          <ph-tick></ph-tick>
          <app-clock></app-clock>
          <app-i18n-select class="grid">{languageSelectToJSX(t, language)}</app-i18n-select>
        </div>
        <div class="container mx-auto py-8">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">{t('nav.home')}</h1>
          </div>
        </div>

        <debug-ctx>
          <game-ctx></game-ctx>
        </debug-ctx>

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
    </zeit-ctx>
  </>
);

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
@injectable
export class AppElement extends HTMLElement {
  static observedAttributes = ['lang'];
  #logger = inject(Debug);
  #i18n = inject(TranslationProvider);
  #zeit = inject(Zeitgeber);

  connectedCallback() {
    this.#logger().log('AppElement connected!');
  }

  attributeChangedCallback(name: string = 'lang', oldValue: string, newValue: string) {
    if (name !== 'lang' || !newValue) {
      return;
    }
    const logger = this.#logger();
    const i18n = this.#i18n();
    if (!i18n.set(newValue as Language) && !oldValue) {
      logger.log('App I18n:', newValue, '[no update]');
      return;
    }
    logger.log('App I18n:', newValue, '[updated], previously', oldValue);
    const title = 'CS Phlame';
    const zeit = this.#zeit();
    this.innerHTML = raw(
      appToJSX(i18n.translate, title, zeit.tick, zeit.time, newValue as Language),
    );
    logger.log('App Update:', title, zeit.tick, newValue);
  }
}
