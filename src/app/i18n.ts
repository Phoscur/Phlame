export const languages = {
  en: 'English',
  de: 'Deutsch',
};

export const defaultLang = 'en';

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.planet': 'Planet',
    'resource.metallic': 'Metals',
    'resource.crystalline': 'Crystals',
    'resource.bubbles': 'Bubbles',
  },
  de: {
    'nav.home': 'Übersicht',
  },
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export type TranslationIndex = (typeof ui)[typeof defaultLang];
export type TranslationEntries = keyof TranslationIndex;
export type I18n = (key: TranslationEntries) => string;

export function useTranslations(lang: keyof typeof ui): I18n {
  return function t(key) {
    return ((ui[lang] || ui[defaultLang]) as TranslationIndex)[key];
  };
}

// inspired by https://docs.astro.build/en/recipes/i18n/
