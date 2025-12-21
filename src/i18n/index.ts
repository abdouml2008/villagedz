import { ar } from './translations/ar';
import { en } from './translations/en';

export const translations = {
  ar,
  en,
} as const;

export type TranslationKey = typeof ar;
