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
  },
} as const;

type BasicIndex = (typeof basic)[typeof defaultLang];
type BasicEntry = keyof BasicIndex;
export type SlottedTranslate = (index: BasicIndex, ...args: BasicEntry[]) => string;

const composite = {
  en: {
    'resource.amount': (t: BasicIndex, resource: ResourceEntry, amount = 0) =>
      amount === 1
        ? `1 ${t[(resource + '.singular') as ResourceSingularEntry]}`
        : `${amount} ${t[resource || 'resource.unknown']}`,
    'building.action.research': (t: BasicIndex, building: BuildingEntry) =>
      `Research ${t[building || 'building.missing']}`,
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

type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export type I18n = <Key extends Entry>(
  key: Key,
  ...slots: Key extends EntryWithSlots ? Tail<Parameters<EntriesSlotsIndex[Key]>> : []
) => string;

const FALLBACK_LANGUAGE: Language = defaultLang;

export function useTranslations(lang: Language): I18n {
  return function t(key, ...slots) {
    const translations = (index[lang] || index[defaultLang]) as TranslationIndex;
    let f = translations[key];
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
