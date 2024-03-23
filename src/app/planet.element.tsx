import { raw } from 'hono/html';
import { I18n, defaultLang, useTranslations } from './i18n';
import { BubblesIcon, CrystallineIcon, MetallicIcon } from './icons.svg';

const template = (t: I18n) => (
  <>
    <h2 class="text-xl font-semibold mb-2">Planet</h2>
    <img src="/dall-e-planet.png" alt="Planet" class="w-20 mx-auto mb-4" />
    <ul>
      <li class="bg-m-f1">
        <MetallicIcon /> {t('resource.metallic')}- 1000
      </li>
      <li class="bg-c-f1">
        <CrystallineIcon /> {t('resource.crystalline')}- 1000
      </li>
      <li class="bg-b-f2">
        <BubblesIcon /> {t('resource.bubbles')}- 1000
      </li>
    </ul>
  </>
);

export class PlanetElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const t = useTranslations(defaultLang);
    const html = template(t);
    this.innerHTML = raw(html);
  }
}

customElements.define('ph-planet', PlanetElement);
