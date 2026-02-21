import { en } from './en';
import { hi } from './hi';

export const translations = {
  en,
  hi,
};

export const getTranslation = (language) => {
  return translations[language] || translations.en;
};
