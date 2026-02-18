'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { MapPin, Phone, Clock } from 'lucide-react'

export function Footer() {
  const { data: session } = useSession()
  const t = useTranslations('footer')

  return (
    <footer className="bg-secondary border-t border-border">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">TZH</span>
              </div>
              <span className="text-base font-semibold text-foreground font-display">TZH Sports Centre</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">{t('quickLinks')}</h3>
            <div className="space-y-3">
              <Link href="/booking" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('bookCourt')}
              </Link>
              <Link href="/lessons" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('lessons')}
              </Link>
              <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('myBookings')}
              </Link>
              <Link href="/updates" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('updates')}
              </Link>
              <Link href="/shop" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('shop')}
              </Link>
            </div>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">{t('contact')}</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="leading-relaxed">
                    Jalan Sekolah La Salle,<br />
                    11400 Ayer Itam, Penang
                  </p>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm"
              >
                {t('getDirections')}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {/* Mini map preview */}
              <a
                href="https://maps.app.goo.gl/6id7KLMbwohP7o9J6"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors"
              >
                <div className="bg-muted/50 px-3 py-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>View on Google Maps</span>
                </div>
              </a>
            </div>
          </div>

          {/* Hours & Phone */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Operating Hours
              </span>
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              {/* Hours table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Mon - Fri</span>
                  <span className="font-medium text-foreground">3PM - 12AM</span>
                </div>
                <div className="border-t border-border/50" />
                <div className="flex justify-between items-center">
                  <span>Sat - Sun</span>
                  <span className="font-medium text-foreground">9AM - 12AM</span>
                </div>
              </div>

              {/* Phone numbers */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-0.5">{t('courtBookings')}</p>
                    <a href="tel:+601168688508" className="font-medium text-foreground hover:text-primary transition-colors">
                      011-6868 8508
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-0.5">{t('lessonsEnquiry')}</p>
                    <a href="tel:+601175758508" className="font-medium text-foreground hover:text-primary transition-colors">
                      011-7575 8508
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground/60">
            &copy; {new Date().getFullYear()} {t('copyright')}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground/60">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
