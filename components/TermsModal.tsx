'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  const t = useTranslations('terms')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('pageTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('pageSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {SECTION_KEYS.map((key) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {t(`sections.${key}.title`)}
              </h3>
              <div className="pl-5 border-l-2 border-primary/20 space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`sections.${key}.content`)}
                </p>
                {hasKey(key, 'conditions') && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`sections.${key}.conditions`)}
                  </p>
                )}
                {hasKey(key, 'extra') && (
                  <p className="text-xs font-medium text-foreground/80 bg-secondary rounded-lg px-3 py-2">
                    {t(`sections.${key}.extra`)}
                  </p>
                )}
                {hasKey(key, 'whatsapp') && (
                  <p className="text-sm text-muted-foreground">
                    {t(`sections.${key}.whatsapp`)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Agreement footer */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm font-medium text-foreground">
              {t('agreement')}
            </p>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function hasKey(section: string, key: string): boolean {
  const extras: Record<string, string[]> = {
    coaching: ['extra'],
    confirmation: ['extra'],
    paymentDetails: ['whatsapp'],
    transfer: ['conditions', 'extra'],
  }
  return extras[section]?.includes(key) ?? false
}
