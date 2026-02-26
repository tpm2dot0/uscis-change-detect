import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zh from './zh.json';
import { getLanguagePref } from '@/lib/storage';

const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
const defaultLang = browserLang === 'zh' ? 'zh' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Load saved preference asynchronously
getLanguagePref().then((lang) => {
  if (lang && lang !== i18n.language) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
