'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Facebook, Instagram, Youtube, MapPin, Phone, Clock } from 'lucide-react'

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
            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-200"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-200"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-200"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
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
                    <a href="tel:+60116868508" className="font-medium text-foreground hover:text-primary transition-colors">
                      011-6868 8508
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-0.5">{t('lessonsEnquiry')}</p>
                    <a href="tel:+60117575508" className="font-medium text-foreground hover:text-primary transition-colors">
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
