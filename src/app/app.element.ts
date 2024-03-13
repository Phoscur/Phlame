import './app.element.css';
import { defaultLang, useTranslations } from './i18n';
import { BubblesIcon, CrystallineIcon, MetallicIcon } from './icons.svg';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'app';
    const t = useTranslations(defaultLang);
    this.innerHTML = `
    <div class="wrapper">
      <div class="container">
        <div id="welcome" class="h-16 mb-16 mx-auto grid grid-flow-col gap-8 auto-cols-max">
          <div class="w-16 border-solid border-2 border-sky-500">
            ${MetallicIcon()}
          </div>
          <div class="w-16 border-solid border-2 border-sky-500">
            ${CrystallineIcon()}
          </div>
          <div class="w-16 border-solid border-2 border-sky-500">
            ${BubblesIcon()}
          </div>
          <h1 hx-get="/sum" hx-swap="outerHTML">
            <span> Hello there, </span>
            Welcome ${title} 👋 ${t('nav.home')} ${t('nav.planet')}
          </h1>
          
        </div>
      </div>
    </div>
    <div class="container mx-auto py-8">
        <div class="text-center mb-6">
            <img src="/dall-e-planet.png" alt="Planet" class="w-32 mx-auto mb-4">
            <h1 class="text-2xl font-bold">Galactic Browser Game</h1>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <ph-planet />
                </div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <ph-planet />
                </div>
            </div>
            <div class="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
                <div>
                  <ph-planet />
                </div>
            </div>
        </div>
    </div>
      `;
  }
}
customElements.define('app-root', AppElement);
