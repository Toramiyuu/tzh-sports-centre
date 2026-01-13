// Shared i18n types and constants - can be imported anywhere
export type Locale = 'en' | 'ms' | 'zh'

export const locales: Locale[] = ['en', 'ms', 'zh']
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
  zh: '中文',
}
