import './app.element.css';
import { defaultLang, useTranslations } from './i18n';
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

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'Phlame';
    const t = useTranslations(defaultLang);
    this.innerHTML = `
    <div class="wrapper">
      <div class="flex flex-row-reverse">
        <debug-ctx>
          <ph-tick></ph-tick>
        </debug-ctx>
        <debug-ctx>
          <app-clock></app-clock>
        </debug-ctx>
      </div>
      <div class="container">
        <div id="welcome" class="h-8 mb-16 mx-auto grid grid-flow-col gap-4 auto-cols-max">
          <div class="border-solid border-2 border-sky-500 text-metallic">
            ${MetallicIcon()}
          </div>
          <div class="border-solid border-2 border-sky-500 text-crystalline-dark">
            ${CrystallineIcon()}
          </div>
          <div class="border-solid border-2 border-sky-500 text-liquid">
            ${BubblesIcon()}
          </div>
          <div class="border-solid border-2 border-sky-500 text-energy-dark">
            ${EnergyIcon()}
          </div>
          <div>
            ${MineIcon()}
          </div>
          <div>
            ${SiloIcon()}
          </div>
          <div>
            ${PowerPlantSolarIcon()}
          </div>
          <div>
            ${PowerPlantFusionIcon()}
          </div>
        </div>
        <h2 class="ml-5 mt-5 text-xl ring-1 ring-orange-400 hover:bg-orange-800 inline-flex rounded-md px-5 py-5" hx-get="/sum" hx-swap="outerHTML">
          ${title} 👋 ${t('nav.planet')}
        </h2>
      </div>
    </div>
    <div class="container mx-auto py-8">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">${t('nav.home')}</h1>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class=""><ph-planet /></div>
            <div class=""><ph-planet /></div>
            <div class=""><ph-planet /></div>
        </div>
    </div>
      `;
  }
}
