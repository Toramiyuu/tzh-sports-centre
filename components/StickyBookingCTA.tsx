'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function StickyBookingCTA() {
  const pathname = usePathname()
  const t = useTranslations('home.hero')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hide on booking page and admin pages
  if (pathname.startsWith('/booking') || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-primary/95 backdrop-blur-sm border-t border-primary/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link href="/booking" className="flex items-center justify-between">
          <div>
            <span className="text-white font-semibold text-sm">{t('bookCourt')}</span>
            <span className="text-white/70 text-xs block">{t('stat.price')}</span>
          </div>
          <div className="bg-white text-primary font-semibold text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
            {t('bookCourt')}
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  )
}
