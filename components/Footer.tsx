'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const { data: session } = useSession()
  const t = useTranslations('footer')

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">TZH</span>
              </div>
              <span className="text-base font-semibold text-neutral-900">TZH Sports Centre</span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">{t('quickLinks')}</h3>
            <div className="space-y-3">
              <Link href="/booking" className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                {t('bookCourt')}
              </Link>
              <Link href="/lessons" className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                {t('lessons')}
              </Link>
              <Link href="/stringing" className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                {t('stringing')}
              </Link>
              <Link href="/dashboard" className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                {t('myBookings')}
              </Link>
              <Link href="/updates" className="block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                {t('updates')}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">{t('contact')}</h3>
            <div className="space-y-3 text-sm text-neutral-500">
              <p>
                Jalan Sekolah La Salle,<br />
                11400 Ayer Itam, Penang
              </p>
              <p>
                <a href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">
                  {t('getDirections')} →
                </a>
              </p>
            </div>
          </div>

          {/* Hours & Phone */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-neutral-500">
              <p>
                {t('courtBookings')}:<br />
                <a href="tel:+60116868508" className="hover:text-neutral-900 transition-colors">011-6868 8508</a>
              </p>
              <p>
                {t('lessonsEnquiry')}:<br />
                <a href="tel:+60117575508" className="hover:text-neutral-900 transition-colors">011-7575 8508</a>
              </p>
              <p className="pt-2">
                {t('weekdays')}<br />
                {t('weekends')}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-12 pt-8 text-center text-sm text-neutral-400">
          <p>&copy; {new Date().getFullYear()} {t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
