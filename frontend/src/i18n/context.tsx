import { createContext, useContext, useState, useEffect } from 'react';
import type { Locale, Translations, ReactNode } from './index';
import { en } from './en';
import { ta } from './ta';
import { te } from './te';
import { hi } from './hi';

const translations: Record<Locale, Translations> = {
  en,
  ta,
  te,
  hi,
};

const DEFAULT_LOCALE: Locale = 'en';
const STORAGE_KEY = 'wecare-language';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Locale[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && stored in translations) {
        return stored;
      }
    }
    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English
        let fallback: unknown = translations.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = (fallback as Record<string, unknown>)[fk];
          } else {
            return key; // Return key if not found
          }
        }
        value = fallback;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace params like {{count}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? '');
      });
    }

    return value;
  };

  const availableLocales: Locale[] = ['en', 'ta', 'te', 'hi'];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useLocale() {
  const { locale } = useTranslation();
  return locale;
}

export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: 'English',
    ta: 'தமிழ்',
    te: 'తెలుగు',
    hi: 'हिन्दी',
  };
  return names[locale] ?? locale;
}

export function getSpeechLanguageCode(locale: Locale): string {
  const codes: Record<Locale, string> = {
    en: 'en-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };
  return codes[locale] ?? 'en-IN';
}