import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en } from './locales/en';
import { rw } from './locales/rw';
import { fr } from './locales/fr';
import type { Locale } from './types';

const dictionaries = { en, rw, fr } as const;

export const LOCALE_INTL: Record<Locale, string> = {
  en: 'en-GB',
  rw: 'rw-RW',
  fr: 'fr-FR',
};

function syncDocumentLang(locale: Locale) {
  document.documentElement.lang = locale === 'rw' ? 'rw' : locale;
}

function getNested(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as object)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''));
}

function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[locale] as unknown as Record<string, unknown>;
  let text = getNested(dict, key);
  if (text === key && locale !== 'en') {
    text = getNested(dictionaries.en as unknown as Record<string, unknown>, key);
  }
  return interpolate(text, params);
}

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      setLocale: (locale) => {
        syncDocumentLang(locale);
        set({ locale });
      },
      t: (key, params) => translate(get().locale, key, params),
    }),
    {
      name: 'locale-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.locale) syncDocumentLang(state.locale);
      },
    }
  )
);

export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const t = useI18nStore((s) => s.t);
  return { locale, setLocale, t };
}

export function formatLocaleDate(date: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_INTL[locale] || 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function useFormatDate() {
  const locale = useI18nStore((s) => s.locale);
  return (date: string | Date) => formatLocaleDate(date, locale);
}

export { dictionaries };
