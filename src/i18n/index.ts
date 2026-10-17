import { en } from './en';
import { gu } from './gu';

export type Locale = 'en' | 'gu';
export const defaultLocale: Locale = 'en';
export const supportedLocales: Locale[] = ['en', 'gu'];

const dictionaries = {
  en,
  gu,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof en>;

export function getTranslation(locale: Locale = 'en', key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[locale] || dictionaries.en;
  const keys = key.split('.');
  
  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English if key missing in target locale
      let fallback: any = dictionaries.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  let result = current;
  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal));
    }
  }

  return result;
}

export function createTranslator(locale: Locale = 'en') {
  return (key: string, params?: Record<string, string | number>) => getTranslation(locale, key, params);
}
