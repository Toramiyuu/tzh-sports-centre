// Server-only next-intl request configuration
// This file reads the locale from cookies for server components
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { locales, defaultLocale, Locale } from '@/lib/i18n'

export default getRequestConfig(async () => {
  // Read locale from cookie (set by client-side I18nProvider)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined

  // Validate and use cookie value, fallback to default
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
