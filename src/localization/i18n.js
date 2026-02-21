import { I18n } from 'i18n-js';
import en from './en.json';
import hi from './hi.json';

const i18n = new I18n({ en, hi });

i18n.enableFallback = true;
i18n.locale = 'en';

export const setI18nConfig = (lang) => {
  i18n.locale = lang;
};

export default i18n;
