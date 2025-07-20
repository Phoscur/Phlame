import { inject, injectable } from '@joist/di';
import type { FC } from 'hono/jsx';
import { I18n } from './i18n';
import { TranslationProvider } from './app.element';
import { Debug } from './debug.element';
import { BubblesIcon, CrystallineIcon, EnergyIcon, MetallicIcon } from './icons.svg';
import { EconomyService, ProductionTable, ResourceIdentifier } from './engine';
import { Zeitgeber } from './signals/zeitgeber';

function abbreviateAmount(t: I18n, amount: number): string {
  // TODO shorten amount in kilos: e.g.: k, m, K, M
  return `${amount}`;
}

interface ResourceProps {
  t: I18n;
  amount: number;
  rate: number;
}

export const resourceMetallicToJSX: FC<ResourceProps> = ({ t, amount, rate }) => (
  <>
    <span
      class="w-20 bg-gray-700 text-gray-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-gray-500 tracking-tight"
    >
      <MetallicIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
      <span class="resource-rate hidden">{rate}</span>
    </span>
  </>
);
export const resourceCrystallineToJSX: FC<ResourceProps> = ({ t, amount, rate }) => (
  <>
    <span
      class="w-20 bg-red-950 text-red-400 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
              shadow-sm ring-1 ring-inset ring-red-700 hover:bg-red-800 tracking-wide"
    >
      <CrystallineIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-red-950" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
      <span class="resource-rate hidden">{rate}</span>
    </span>
  </>
);
export const resourceBubblesToJSX: FC<ResourceProps> = ({ t, amount, rate }) => (
  <>
    <span
      class="w-20 bg-blue-950 text-blue-500 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
      shadow-sm ring-1 ring-inset ring-blue-500 hover:bg-blue-800"
    >
      <BubblesIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
      <span class="resource-amount font-mono">{abbreviateAmount(t, amount)}</span>
      <span class="resource-rate hidden">{rate}</span>
    </span>
  </>
);

export const resourceEnergyToJSX: FC<ResourceProps> = ({ t, amount, rate }) => {
  const limit = amount;
  return (
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
};

export const resourceRenderMap: Record<ResourceIdentifier, FC<ResourceProps>> = {
  metallic: resourceMetallicToJSX,
  crystalline: resourceCrystallineToJSX,
  liquid: resourceBubblesToJSX,
  energy: resourceEnergyToJSX,
  null: () => <>Null</>,
} as const;

export const resourcesToJSX: FC<{ t: I18n; productionTable: ProductionTable }> = ({
  t,
  productionTable,
}) => (
  <>
    <div class="flex">
      {/*JSON.stringify(productionTable)*/}
      {productionTable.map(([type, rate, amount, max, min]) => (
        <>
          <span class="ml-2">
            <ph-resource type={type} amount={amount} rate={rate} max={max} min={min}>
              {resourceRenderMap[type]({ t, amount, rate })}
            </ph-resource>
          </span>
        </>
      ))}
    </div>
  </>
);

@injectable()
export class ResourceElement extends HTMLElement {
  public static observedAttributes = ['type', 'amount', 'rate', 'min', 'max'];
  #i18n = inject(TranslationProvider);

  get amountElement(): Element | null {
    return (
      this.getElementsByClassName('resource-amount').item(0) ??
      this.getElementsByClassName('energy-limit').item(0)
    );
  }

  get rateElement(): Element | null {
    return (
      this.getElementsByClassName('resource-rate').item(0) ??
      this.getElementsByClassName('energy-rate').item(0)
    );
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if ('amount' === name && this.amountElement) {
      this.amountElement.innerHTML = abbreviateAmount(this.#i18n().translate, Number(newValue));
    }
    if ('rate' === name && this.rateElement) {
      this.rateElement.innerHTML = abbreviateAmount(this.#i18n().translate, Number(newValue));
    }
  }
}

@injectable()
export class ResourcesElement extends HTMLElement {
  public static observedAttributes = [];
  #logger = inject(Debug);
  //#i18n = inject(TranslationProvider);
  #zeit = inject(Zeitgeber);
  #economy = inject(EconomyService);
  #cleanup = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

  get resourcesElements(): HTMLCollection {
    return this.getElementsByTagName('ph-resource');
  }

  connectedCallback() {
    const zeit = this.#zeit();
    const eco = this.#economy();

    const c = new zeit.Computed(() => {
      const { tick } = zeit;
      eco.current.update(tick);
      return eco.production;
    });

    this.#cleanup = zeit.effect(() => {
      const production = c.get();
      // this.#logger().log('Resources update:', production);
      this.update(production);
    });
  }

  disconnectedCallback() {
    this.#cleanup();
    this.#logger().log('ResourcesElement disconnected!');
  }

  update(table: ProductionTable) {
    for (let i = 0; i < table.length; i++) {
      const [t, rate, amount, max, min] = table[i];
      this.setResourceAmount(i, amount);
    }
    // TODO (re-)render the other attributes or everything:
    // this.innerHTML = raw(resourcesToJSX(this.#i18n().translate, table));
  }

  setResourceAmount(index: number, amount: number) {
    const el = this.resourcesElements[index];
    const attr = el.attributes.getNamedItem('amount');
    if (!attr) return;
    attr.value = `${amount}`;
    el.attributes.setNamedItem(attr);
  }
}
