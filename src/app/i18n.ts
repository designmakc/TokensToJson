import { ru } from './locales/ru';

export type LanguageT = 'en' | 'ru';

let currentLanguage: LanguageT = 'en';

export const setLanguage = (language: LanguageT) => {
  currentLanguage = language;
};

export const getLanguage = (): LanguageT => currentLanguage;

// The English string is the key. Missing translations fall through to English,
// so untranslated strings can never break the UI.
export const t = (text: string): string =>
  (currentLanguage === 'ru' && ru[text]) || text;
