'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatWeekRange, getStartOfWeek } from '@/lib/timetable-utils'
import { useTranslations } from 'next-intl'

interface WeekNavigatorProps {
  currentWeekStart: Date
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export function WeekNavigator({
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  const t = useTranslations('member.timetable')

  const today = new Date()
  const todayWeekStart = getStartOfWeek(today)
  const isCurrentWeek = currentWeekStart.getTime() === todayWeekStart.getTime()

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousWeek}
          aria-label={t('prevWeek')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextWeek}
          aria-label={t('nextWeek')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="ml-2"
          >
            <Calendar className="h-4 w-4 mr-1" />
            {t('today')}
          </Button>
        )}
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {formatWeekRange(currentWeekStart)}
      </div>
    </div>
  )
}
