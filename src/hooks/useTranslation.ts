import { useLanguage } from '@/contexts/LanguageContext';
import { translations, TranslationKey } from '@/i18n';

export function useTranslation() {
  const { language } = useLanguage();
  
  const t = translations[language] as TranslationKey;
  
  return { t, language };
}
