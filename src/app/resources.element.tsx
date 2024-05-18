import { inject, injectable } from '@joist/di';
import { raw } from 'hono/html';
import { I18n, defaultLang, useTranslations } from './i18n';
import { BubblesIcon, CrystallineIcon, EnergyIcon, MetallicIcon } from './icons.svg';
import { ResourceIdentifier } from './engine';
import { Zeitgeber } from './signals/zeitgeber';
import { ResourceTable } from '@phlame/engine';

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

export const resourceEnergyToJSX = (t: I18n, limit: number, rate: number) => (
  <>
    <span
      class="bg-orange-950 text-orange-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-orange-500 hover:bg-orange-800"
    >
      <EnergyIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-orange-950" />
      <span class="energy-rate">{rate}</span>/<span class="energy-limit">{limit}</span>
    </span>
  </>
);

export const resourceRenderMap: Record<
  ResourceIdentifier,
  (t: I18n, amount: number, rate: number) => JSX.Element
> = {
  metallic: resourceMetallicToJSX,
  crystalline: resourceCrystallineToJSX,
  liquid: resourceBubblesToJSX,
  energy: resourceEnergyToJSX,
  null: () => <>Null</>,
} as const;

type Resource = keyof typeof resourceRenderMap;

export const resourcesToJSX = (t: I18n, productionTable: ResourceTable<ResourceIdentifier>) => (
  <>
    <div class="flex">
      {/*JSON.stringify(productionTable)*/}
      {productionTable.map(([type, rate, amount, max, min]) => (
        <>
          <span class="ml-2">
            <ph-resource type={type} amount={amount} rate={rate} max={max} min={min}>
              {resourceRenderMap[type](t, amount, rate)}
            </ph-resource>
          </span>
        </>
      ))}
    </div>
  </>
);

@injectable
export class ResourceElement extends HTMLElement {
  public static observedAttributes = ['type', 'amount', 'rate', 'min', 'max'];
  private intervalId: number | undefined;

  connectedCallback() {
    const t = useTranslations(defaultLang);

    let amount = Number(this.attributes.getNamedItem('amount')?.value);
    const rate = Number(this.attributes.getNamedItem('rate')?.value);
    const min = Number(this.attributes.getNamedItem('min')?.value) || 0;
    const max = Number(this.attributes.getNamedItem('max')?.value) || Infinity;
    // const kind = (this.attributes.getNamedItem('type')?.value || 'metallic') as Resource;

    //this.render(t, kind, amount, rate);
    // TODO listen for attribute changes instead

    const el = this.getElementsByClassName('resource-amount')[0] as HTMLElement | undefined;

    if (!el) return; // energy does not get updates

    this.intervalId = window.setInterval(() => {
      amount += rate;
      // console.log(kind, amount, rate, this.getElementsByClassName('resource-amount'));
      if (amount >= max) {
        amount = max;
        window.clearInterval(this.intervalId);
      }
      if (amount <= min) {
        amount = min;
        window.clearInterval(this.intervalId);
      }
      el.innerHTML = abbreviateAmount(t, amount);
      // avoid expensive this.render(t, kind, amount, rate);
    }, 1000);
  }

  disconnectedCallback() {
    window.clearInterval(this.intervalId);
  }

  render(t: I18n, kind: Resource, amount: number, rate: number) {
    const html = resourceRenderMap[kind](t, amount, rate);
    // this.innerHTML = raw(html);
    console.log('RTM', kind, amount, rate, raw(html));
  }
}

export class EnergyElement extends HTMLElement {
  public static observedAttributes = ['type', 'amount', 'total'];

  connectedCallback() {
    const t = useTranslations(defaultLang);
    const amount = Number(this.attributes.getNamedItem('amount')?.value);
    const total = Number(this.attributes.getNamedItem('total')?.value);
    const kind = (this.attributes.getNamedItem('type')?.value ?? 'energy') as Resource;
    this.render(t, kind, amount, total);
  }

  render(t: I18n, kind: Resource, amount: number, rate: number) {
    console.log('RR', kind, amount, rate);
    const html = resourceRenderMap[kind](t, amount, rate);
    this.innerHTML = raw(html);
  }
}

export class ResourcesElement extends HTMLElement {
  public static observedAttributes = [];
  // TODO inject Economy
  // TODO inject Zeitgeber
  // #zeit = inject(Zeitgeber);

  /*connectedCallback() {
    const t = useTranslations(defaultLang);
    const productionTable = [
      ['energy', 150, 150],
      ['iron', 1, 3, 0, Infinity],
      ['silicon', -1, 3, 0, Infinity],
    ];
    const html = resourcesToJSX(t);
    this.innerHTML = raw(html);
  }*/
}
