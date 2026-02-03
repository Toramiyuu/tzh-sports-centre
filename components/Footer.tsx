'use client'

import Link from 'next/link'
import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const { data: session } = useSession()
  const t = useTranslations('footer')

  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">TZH</span>
              </div>
              <span className="text-2xl font-bold">TZH Sports Centre</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-amber-400">{t('contact')}</h3>
            <div className="space-y-4 text-zinc-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <span>Jalan Sekolah La Salle, 11400 Ayer Itam, Penang</span>
                  <a
                    href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-amber-400 hover:text-amber-300 mt-1 transition-colors"
                  >
                    {t('getDirections')} →
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <div>
                  <div>{t('courtBookings')}: <a href="tel:+60116868508" className="hover:text-white transition-colors">011-6868 8508</a></div>
                  <div>{t('lessonsEnquiry')}: <a href="tel:+60117575508" className="hover:text-white transition-colors">011-7575 8508</a></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <a
                  href="https://wa.me/60116868508?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20court%20booking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  WhatsApp Us
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <div>{t('weekdays')}</div>
                  <div>{t('weekends')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-6 text-amber-400">{t('quickLinks')}</h3>
            <div className="space-y-3">
              <Link
                href="/booking"
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                {t('bookCourt')}
              </Link>
              <Link
                href="/lessons"
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                {t('lessons')}
              </Link>
              <Link
                href="/stringing"
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                {t('stringing')}
              </Link>
              <Link
                href="/dashboard"
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                {t('myBookings')}
              </Link>
              <Link
                href="/updates"
                className="block text-zinc-400 hover:text-white transition-colors"
              >
                {t('updates')}
              </Link>
              {!session && (
                <>
                  <Link
                    href="/auth/login"
                    className="block text-zinc-400 hover:text-white transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block text-zinc-400 hover:text-white transition-colors"
                  >
                    {t('signUp')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 text-center text-zinc-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
