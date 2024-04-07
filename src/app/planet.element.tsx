import { raw } from 'hono/html';
import { I18n, defaultLang, useTranslations } from './i18n';
import {
  BubblesIcon,
  CrystallineIcon,
  EnergyIcon,
  MetallicIcon,
  MineIcon,
  PowerPlantFusionIcon,
  PowerPlantSolarIcon,
} from './icons.svg';

export const planetToJSX = (t: I18n) => (
  <>
    <div class="bg-gray-800 p-4 rounded-lg bg-cover bg-[url('/dall-e-planet.png')]">
      <div class="flex justify-between">
        <div class="min-w-0">
          <h2 class="text-2xl font-bold leading-7 text-gray-500 sm:truncate sm:text-3xl sm:tracking-tight">
            Planet
          </h2>
          <div>
            <div class="mt-2 flex items-center text-sm text-gray-500">
              <svg
                class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clip-rule="evenodd"
                />
              </svg>
              Galaxy
            </div>
          </div>
        </div>
        <div class="mt-5 flex lg:ml-4 lg:mt-0">
          <span class="">
            <span
              class="bg-gray-700 text-gray-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500"
            >
              <MetallicIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              1000
            </span>
          </span>
          <span class="ml-2">
            <span
              class="bg-red-950 text-red-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-red-700 hover:bg-red-800"
            >
              <CrystallineIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-red-950" />
              1000
            </span>
          </span>
          <span class="ml-2">
            <span
              class="bg-blue-950 text-blue-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-blue-500 hover:bg-blue-800"
            >
              <BubblesIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              1000
            </span>
          </span>
          <span class="ml-2">
            <span
              class="bg-orange-950 text-orange-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-orange-500 hover:bg-orange-800"
            >
              <EnergyIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-orange-950 " />
              10/10
            </span>
          </span>
        </div>
      </div>
      <br class="mb-[200px]" />
      <ul>
        <li class="bg-metallic-dark text-metallic flex flex-columns">
          <MetallicIcon />
          <MineIcon />
          {t('resource.metallic')} - 1000
        </li>
        <li class="bg-crystalline-dark text-crystalline flex flex-columns">
          <CrystallineIcon className="text-crystalline-dark" />
          <MineIcon />
          {t('resource.crystalline')} - 9999
        </li>
        <li class="bg-liquid-dark text-liquid flex flex-columns">
          <BubblesIcon />
          <MineIcon />
          {t('resource.liquid')} - 1000
        </li>
        <li class="bg-energy-dark text-energy flex flex-columns">
          <EnergyIcon className="text-energy-dark" />
          <PowerPlantSolarIcon className="text-energy-primary" />
          <PowerPlantFusionIcon className="text-energy-primary" />
          {t('resource.energy')} - 1000
        </li>
      </ul>
    </div>
  </>
);

export class PlanetElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const t = useTranslations(defaultLang);
    const html = planetToJSX(t);
    this.innerHTML = raw(html);
  }
}
