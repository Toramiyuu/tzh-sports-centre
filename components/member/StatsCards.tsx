'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StatsCardsProps {
  upcomingCount: number
  pendingCount: number
  completedCount: number
}

export function StatsCards({
  upcomingCount,
  pendingCount,
  completedCount,
}: StatsCardsProps) {
  const t = useTranslations('member.stats')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">{t('upcomingLessons')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">{t('pendingRequests')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground">{t('completedLessons')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
