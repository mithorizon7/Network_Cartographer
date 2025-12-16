import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import lv from './locales/lv.json';
import ru from './locales/ru.json';

const resources = {
  en: { translation: en },
  lv: { translation: lv },
  ru: { translation: ru },
};

const isDev = import.meta.env.DEV;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: ['lv', 'en'],
    supportedLngs: ['en', 'lv', 'ru'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    },
    returnEmptyString: false,
    saveMissing: isDev,
    missingKeyHandler: isDev ? (lngs, ns, key) => {
      console.warn(`[MISSING i18n] ${lngs.join(', ')} - ${ns}:${key}`);
    } : undefined,
    parseMissingKeyHandler: isDev ? (key) => `[MISSING: ${key}]` : undefined,
  });

export default i18n;
