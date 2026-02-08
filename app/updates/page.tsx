'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { updateLog } from '@/lib/update-log'
import { ArrowLeft, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function UpdatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('updates')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/updates')
    }
  }, [session, status, router])

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {updateLog.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Date/Time header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 bg-accent border border-border rounded-full px-4 py-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    {formatDate(entry.date)} &middot; {entry.time}
                  </span>
                </div>
              </div>

              {/* Update card */}
              <div className="bg-card rounded-xl border border-border p-5 ml-2 border-l-4 border-l-teal-500">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t(`entries.${entry.id}.title`)}
                </h3>
                <ul className="space-y-2">
                  {Array.from({ length: entry.changeCount }, (_, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-muted-foreground/70 mt-1.5 flex-shrink-0">&#8226;</span>
                      <span>{t(`entries.${entry.id}.change${i + 1}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connector line */}
              {index < updateLog.length - 1 && (
                <div className="absolute left-5 top-full w-0.5 h-8 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
