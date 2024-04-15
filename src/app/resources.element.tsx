import { raw } from 'hono/html';
import { I18n, defaultLang, useTranslations } from './i18n';
import { BubblesIcon, CrystallineIcon, EnergyIcon, MetallicIcon } from './icons.svg';

function abbreviateAmount(t: I18n, amount: number): string {
  // TODO shorten amount in kilos: e.g.: k, m, K, M
  return `${amount}`;
}

export const resourceMetallicToJSX = (t: I18n, amount: number, rate: number) => (
  <>
    <span
      class="w-20 bg-gray-700 text-gray-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500 tracking-tight"
    >
      <MetallicIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
    </span>
  </>
);
export const resourceCrystallineToJSX = (t: I18n, amount: number, rate: number) => (
  <>
    <span
      class="w-20 bg-red-950 text-red-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-red-700 hover:bg-red-800 tracking-wide"
    >
      <CrystallineIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-red-950" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
    </span>
  </>
);
export const resourceBubblesToJSX = (t: I18n, amount: number, rate: number) => (
  <>
    <span
      class="w-20 bg-blue-950 text-blue-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-blue-500 hover:bg-blue-800"
    >
      <BubblesIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
    </span>
  </>
);

export const resourceEnergyToJSX = (t: I18n, amount: number, total: number) => (
  <>
    <span
      class="bg-orange-950 text-orange-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-orange-500 hover:bg-orange-800"
    >
      <EnergyIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-orange-950" />
      <span class="energy-amount">{amount}</span>/<span class="energy-total">{total}</span>
    </span>
  </>
);

export const resourcesToJSX = (t: I18n) => (
  <>
    <div class="flex">
      <span class="">
        <ph-resource type="iron" amount="30" rate="111" max="1000" />
      </span>
      <span class="ml-2">
        <ph-resource type="silicon" amount="30" rate="-111" min="-1000" />
      </span>
      <span class="ml-2">
        <ph-resource type="hydrogen" amount="30" rate="99e+999" max="Infinity" />
      </span>
      <span class="ml-2">
        <ph-energy type="energy" amount="150" total="150" />
      </span>
    </div>
  </>
);

export const resourceRenderMap = {
  iron: resourceMetallicToJSX,
  silicon: resourceCrystallineToJSX,
  hydrogen: resourceBubblesToJSX,
  energy: resourceEnergyToJSX,
} as const;

type Resource = keyof typeof resourceRenderMap;

export class ResourceElement extends HTMLElement {
  public static observedAttributes = ['type', 'amount', 'rate', 'min', 'max'];
  private intervalId: number | undefined;

  connectedCallback() {
    const t = useTranslations(defaultLang);

    let amount = Number(this.attributes.getNamedItem('amount')?.value);
    const rate = Number(this.attributes.getNamedItem('rate')?.value);
    const min = Number(this.attributes.getNamedItem('min')?.value) || 0;
    const max = Number(this.attributes.getNamedItem('max')?.value) || Infinity;
    const kind = (this.attributes.getNamedItem('type')?.value || 'iron') as Resource;

    this.render(t, kind, amount, rate);

    this.intervalId = window.setInterval(() => {
      amount += rate;
      if (amount >= max) {
        amount = max;
        window.clearInterval(this.intervalId);
      }
      if (amount <= min) {
        amount = min;
        window.clearInterval(this.intervalId);
      }
      this.getElementsByClassName('resource-amount')[0].innerHTML = abbreviateAmount(t, amount);
      // avoid expensive this.render(t, kind, amount, rate);
    }, 1000);
  }

  disconnectedCallback() {
    window.clearInterval(this.intervalId);
  }

  render(t: I18n, kind: Resource, amount: number, rate: number) {
    const html = resourceRenderMap[kind](t, amount, rate);
    this.innerHTML = raw(html);
  }
}

export class EnergyElement extends HTMLElement {
  public static observedAttributes = ['type', 'amount', 'total'];

  connectedCallback() {
    const t = useTranslations(defaultLang);
    let amount = Number(this.attributes.getNamedItem('amount')?.value);
    const total = Number(this.attributes.getNamedItem('total')?.value);
    const kind = (this.attributes.getNamedItem('type')?.value || 'energy') as Resource;
    this.render(t, kind, amount, total);
  }

  render(t: I18n, kind: Resource, amount: number, rate: number) {
    const html = resourceRenderMap[kind](t, amount, rate);
    this.innerHTML = raw(html);
  }
}

export class ResourcesElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const t = useTranslations(defaultLang);
    const productionTable = [
      ['energy', 150, 150],
      ['iron', 1, 3, 0, Infinity],
      ['silicon', -1, 3, 0, Infinity],
    ];
    const html = resourcesToJSX(t);
    this.innerHTML = raw(html);
  }
}
