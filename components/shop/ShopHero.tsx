'use client'

import { useTranslations } from 'next-intl'
import { ShoppingBag } from 'lucide-react'

export function ShopHero() {
  const t = useTranslations('shop')

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1854d6]/15 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1854d6] rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[#0a2540] uppercase tracking-wide">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.1] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {t('hero.title')}
          </h1>

          <p className="text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {t('hero.subtitle')}
          </p>
        </div>
      </div>
    </section>
  )
}
