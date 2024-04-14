export const languages = {
  en: 'English',
  de: 'Deutsch',
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

export type ResourceEntries = keyof typeof resources;
export type ResourceSingularEntries = keyof typeof resourcesSingular;

const buildings = {
  'building.missing': 'Missing',
  'building.plant': 'Plant',
  'building.mine': 'Mine',
  'building.silo': 'Silo',
} as const;

export type BuildingEntries = keyof typeof buildings;

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.planet': 'Planet',
    ...resources,
    ...resourcesSingular,
    'building.level': 'Level',
    'building.action.build': 'Build',
    'building.action.upgrade': 'Upgrade',
    'building.action.downgrade': 'Downgrade',
    'building.action.destroy': 'Destroy',
    ...buildings,
  },
  de: {
    'nav.home': 'Übersicht',
  },
} as const;

export type TranslationIndex = (typeof ui)[typeof defaultLang];
export type TranslationEntries = keyof TranslationIndex;

//type Extends<T, U extends T> = U; // type narrowing, thanks to https://stackoverflow.com/questions/53637125/typescript-extract-and-create-union-as-a-subset-of-a-union
//type SlottableEntries = Extends<TranslationEntries, BuildingEntries | ResourceEntries>;

export const sui = {
  en: {
    'resource.amount': (
      ui: TranslationIndex,
      resource: ResourceEntries, // = 'resource.unknown',
      amount: number, // = 0,
    ) =>
      amount === 1
        ? `1 ${ui[(resource + '.singular') as ResourceSingularEntries]}`
        : `${amount} ${ui[resource]}`,
    'building.action.research': (
      ui: TranslationIndex,
      building: BuildingEntries, // = 'building.missing',
    ) => `Research ${ui[building]}`,
  },
  de: {},
} as const;

export type EntriesSlotsIndex = (typeof sui)[typeof defaultLang];
export type EntriesWithSlots = keyof EntriesSlotsIndex;
export type SlottedTranslation = (
  ui: TranslationIndex,
  ...args: (ResourceEntries | BuildingEntries)[]
) => string;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export type I18n = (key: TranslationEntries) => string;
export type I18nWithSlots = <Key extends EntriesWithSlots>(
  key: Key,
  ...slots: Key extends keyof EntriesSlotsIndex ? Tail<Parameters<EntriesSlotsIndex[Key]>> : never
) => string;

export function useTranslations(lang: keyof typeof ui): I18n {
  return function t(key) {
    const translations = (ui[lang] || ui[defaultLang]) as TranslationIndex;
    const f = translations[key];
    return f;
  };
}

export function useSlottedTranslations(lang: keyof typeof ui): I18nWithSlots {
  return function st(key, ...slots) {
    const translations = (ui[lang] || ui[defaultLang]) as TranslationIndex;
    const composableTranslations = (sui[lang] || sui[defaultLang]) as EntriesSlotsIndex;
    const f = composableTranslations[key] as SlottedTranslation;
    return f(translations, ...(slots as Tail<Parameters<typeof f>>));
  };
}

// inspired by https://docs.astro.build/en/recipes/i18n/
