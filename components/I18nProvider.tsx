'use client'

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, locales, defaultLocale } from '@/lib/i18n'

// Import all message files
import enMessages from '@/messages/en.json'
import msMessages from '@/messages/ms.json'
import zhMessages from '@/messages/zh.json'

const messages: Record<Locale, AbstractIntlMessages> = {
  en: enMessages,
  ms: msMessages,
  zh: zhMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function useLocale() {
  const context = useContext(I18nContext)
  // Return default values if context is not available (during SSG/build)
  if (!context) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
    }
  }
  return context
}

// Helper function to set cookie
function setLocaleCookie(locale: Locale) {
  // Set cookie with 1 year expiry
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`
}

// Helper function to get cookie
function getLocaleCookie(): Locale | null {
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
  const value = match ? match[1] as Locale : null
  return value && locales.includes(value) ? value : null
}

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved locale from cookie on mount (cookie is shared with server)
  useEffect(() => {
    const savedLocale = getLocaleCookie() || localStorage.getItem('locale') as Locale | null
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale)
      // Ensure cookie is set (migrate from localStorage if needed)
      setLocaleCookie(savedLocale)
    }
    setIsHydrated(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    setLocaleCookie(newLocale)
    // Force page refresh to update server components
    window.location.reload()
  }

  // Show nothing or a loading state until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <NextIntlClientProvider locale={defaultLocale} messages={messages[defaultLocale]}>
        {children}
      </NextIntlClientProvider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}
