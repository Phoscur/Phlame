import './app.element.css';
import { defaultLang, useTranslations } from './i18n';
import { BubblesIcon, CrystallineIcon, EnergyIcon, MetallicIcon } from './icons.svg';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'app';
    const t = useTranslations(defaultLang);
    this.innerHTML = `
    <div class="wrapper">
      <div class="container">
        <div id="welcome" class="h-16 mb-16 mx-auto grid grid-flow-col gap-4 auto-cols-max">
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
          <h2 class="text-xl" hx-get="/sum" hx-swap="outerHTML">
            <span> Hello there, </span>
            Welcome ${title} 👋 ${t('nav.home')} ${t('nav.planet')}
          </h2>
          
        </div>
      </div>
    </div>
    <div class="container mx-auto py-8">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">Galactic Browser Game based on the Phlame Engine</h1>
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
