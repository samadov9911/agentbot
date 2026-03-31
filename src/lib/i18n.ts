import ru from '@/i18n/ru.json';
import en from '@/i18n/en.json';
import tr from '@/i18n/tr.json';

type TranslationMap = Record<string, Record<string, string>>;

const translations: Record<string, TranslationMap> = { ru, en, tr };

export type Language = 'ru' | 'en' | 'tr';

export function t(key: string, lang: Language = 'ru', vars?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: string | undefined;

  if (translations[lang]) {
    let current: Record<string, unknown> = translations[lang] as unknown as Record<string, unknown>;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        const next = (current as Record<string, unknown>)[k];
        if (typeof next === 'string') {
          value = next;
          break;
        } else if (typeof next === 'object' && next !== null) {
          current = next as Record<string, unknown>;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  // Fallback to Russian
  if (!value && lang !== 'ru') {
    return t(key, 'ru', vars);
  }

  if (!value) {
    return key;
  }

  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      value = value!.replace(`{${k}}`, String(v));
    });
  }

  return value;
}

export const languageNames: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
};

export const languageFlags: Record<Language, string> = {
  ru: '🇷🇺',
  en: '🇺🇸',
  tr: '🇹🇷',
};

export const allLanguages: Language[] = ['ru', 'en', 'tr'];
