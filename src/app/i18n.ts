export const languages = {
  en: 'English',
  de: 'Deutsch',
  // TODO more languages and a way to activate them optionally
  // nl: 'Nederlands',
  // fr: 'Français',
  // pl: 'Polksi',
};

export const defaultLang = 'en';

const resources = {
  'resource.unknown': 'Unknown',
  'resource.metallic': 'Metals',
  'resource.crystalline': 'Crystals',
  'resource.liquid': 'Liquids',
  'resource.energy': 'Energy',
} as const;

const resourcesSingular = {
  'resource.metallic.singular': 'Metal',
  'resource.crystalline.singular': 'Crystal',
  'resource.liquid.singular': 'Liquid',
} as const;

export type ResourceEntry = keyof typeof resources;
type ResourceSingularEntry = keyof typeof resourcesSingular;

const buildings = {
  'building.missing': 'Missing',
  'building.plant': 'Plant',
  'building.mine': 'Mine',
  'building.silo': 'Silo',
} as const;

export type BuildingEntry = keyof typeof buildings;

const basic = {
  en: {
    'nav.home': 'Home',
    'nav.planet': 'Planet',
    ...resources,
    ...resourcesSingular,
    ...buildings,
    'building.level': 'Level',
    'building.action.build': 'Build',
    'building.action.upgrade': 'Upgrade',
    'building.action.downgrade': 'Downgrade',
    'building.action.destroy': 'Destroy',
  },
  de: {
    'nav.home': 'Übersicht',
    'resource.unknown': 'Unbekannt',
    'resource.metallic': 'Metalle',
    'resource.crystalline': 'Kristalline',
    'resource.liquid': 'Gas',
    'resource.energy': 'Energie',
    'resource.metallic.singular': 'Metall',
    'resource.crystalline.singular': 'Kristall',
    'resource.liquid.singular': 'Gas',
  },
} as const;

type BasicIndex = (typeof basic)[typeof defaultLang];
type BasicEntry = keyof BasicIndex;
export type SlottedTranslate = (index: BasicIndex, ...args: BasicEntry[]) => string;

const composite = {
  // requires the BasicIndex to be fully translated to compose!
  en: {
    'resource.amount': (t: BasicIndex, resource: ResourceEntry = 'resource.unknown', amount = 0) =>
      amount === 1
        ? `1 ${t[(resource + '.singular') as ResourceSingularEntry]}`
        : `${amount} ${t[resource]}`,
    'building.action.research': (t: BasicIndex, building: BuildingEntry = 'building.missing') =>
      `Research ${t[building]}`,
  },
  de: {},
} as const;

type EntriesSlotsIndex = (typeof composite)[typeof defaultLang];
type EntryWithSlots = keyof EntriesSlotsIndex;

export const index = {
  en: {
    ...basic.en,
    ...composite.en,
  },
  de: {
    ...basic.de,
    ...composite.de,
  },
} as const;

export type TranslationIndex = (typeof index)[typeof defaultLang];
export type Entry = keyof TranslationIndex;
export type Language = keyof typeof languages;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in basic) return lang as Language;
  return defaultLang;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export type I18n = <Key extends Entry>(
  key: Key,
  ...slots: Key extends EntryWithSlots ? Tail<Parameters<EntriesSlotsIndex[Key]>> : []
) => string;

const FALLBACK_LANGUAGE: Language = defaultLang;

export function useTranslations(lang: Language = defaultLang): I18n {
  return function t(key, ...slots) {
    const translations = index[lang] as TranslationIndex;
    let f = translations[key];
    // eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
    if (FALLBACK_LANGUAGE && !f) {
      f = (index[FALLBACK_LANGUAGE] as TranslationIndex)[key];
    }
    if (typeof f === 'string') {
      return f;
    }
    // we only use types for autocompletion and compile time checking, there are no runtime checks if given slots actually match
    return (f as SlottedTranslate)(translations, ...(slots as Tail<Parameters<SlottedTranslate>>));
  };
}

// inspired by https://docs.astro.build/en/recipes/i18n/
