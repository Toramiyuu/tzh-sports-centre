'use client'

import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocale } from '@/components/I18nProvider'
import { Locale, locales, localeNames } from '@/lib/i18n'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={locale === loc ? 'bg-teal-50 text-teal-600' : ''}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile/navbar
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useLocale()

  const cycleLocale = () => {
    const currentIndex = locales.indexOf(locale)
    const nextIndex = (currentIndex + 1) % locales.length
    setLocale(locales[nextIndex])
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleLocale}
      className="gap-1.5 px-2"
      title="Change language"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium uppercase">{locale}</span>
    </Button>
  )
}
