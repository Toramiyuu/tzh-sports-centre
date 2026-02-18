'use client'

import { useTranslations } from 'next-intl'
import { Shield, FileText } from 'lucide-react'

const SECTION_KEYS = [
  'payment',
  'coaching',
  'confirmation',
  'paymentDetails',
  'outsideSales',
  'cancellation',
  'time',
  'damage',
  'conduct',
  'media',
  'transfer',
  'management',
] as const

export default function TermsPage() {
  const t = useTranslations('terms')

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 bg-secondary border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {t('pageTitle')}
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            {t('pageSubtitle')}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            {t('lastUpdated')}: February 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="space-y-10">
            {SECTION_KEYS.map((key) => (
              <div key={key} className="group">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {t(`sections.${key}.title`)}
                </h2>
                <div className="pl-6 border-l-2 border-primary/20 space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`sections.${key}.content`)}
                  </p>
                  {hasKey(key, 'conditions') && (
                    <p className="text-muted-foreground leading-relaxed">
                      {t(`sections.${key}.conditions`)}
                    </p>
                  )}
                  {hasKey(key, 'extra') && (
                    <p className="text-sm font-medium text-foreground/80 bg-secondary rounded-lg px-4 py-3">
                      {t(`sections.${key}.extra`)}
                    </p>
                  )}
                  {hasKey(key, 'whatsapp') && (
                    <p className="text-muted-foreground">
                      {t(`sections.${key}.whatsapp`)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Agreement footer */}
          <div className="mt-16 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <p className="font-medium text-foreground">
              {t('agreement')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function hasKey(section: string, key: string): boolean {
  const extras: Record<string, string[]> = {
    coaching: ['extra'],
    confirmation: ['extra'],
    paymentDetails: ['whatsapp'],
    transfer: ['conditions', 'extra'],
    management: [],
  }
  return extras[section]?.includes(key) ?? false
}
