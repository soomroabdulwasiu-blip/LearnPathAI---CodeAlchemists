import { translations, Language } from './translations';
import { useAppStore } from '../store/useAppStore';

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const t = (key: keyof typeof translations.en, variables?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.en;
    let text = (dict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, val]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(val));
      });
    }
    return text;
  };

  return { t, language, setLanguage, isRtl: language === 'ur' };
}
