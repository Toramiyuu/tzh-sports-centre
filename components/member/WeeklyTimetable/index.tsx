'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CalendarDays } from 'lucide-react'
import { WeekNavigator } from './WeekNavigator'
import { TimetableGrid } from './TimetableGrid'
import {
  getStartOfWeek,
  addWeeks,
  getWeekDays,
  formatDateString,
  DayAvailability,
} from '@/lib/timetable-utils'
import { useTranslations } from 'next-intl'

interface WeeklyTimetableProps {
  onSlotSelect: (date: Date, time: string) => void
  onAcceptSuggestion?: (requestId: string) => void
  onCounterSuggestion?: (requestId: string) => void
}

interface WeeklyAvailabilityResponse {
  weekStart: string
  weekEnd: string
  days: Record<string, DayAvailability>
}

export function WeeklyTimetable({ onSlotSelect, onAcceptSuggestion, onCounterSuggestion }: WeeklyTimetableProps) {
  const t = useTranslations('member.timetable')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()))
  const [availabilityData, setAvailabilityData] = useState<Record<string, DayAvailability>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeeklyAvailability = useCallback(async (weekStart: Date, retryCount = 0) => {
    setLoading(true)
    setError(null)

    const maxRetries = 2

    try {
      const startDateStr = formatDateString(weekStart)
      const res = await fetch(`/api/member/weekly-availability?startDate=${startDateStr}`)

      if (!res.ok) {
        // Retry on server errors (database cold start)
        if (res.status >= 500 && retryCount < maxRetries) {
          setTimeout(() => fetchWeeklyAvailability(weekStart, retryCount + 1), 1000)
          return
        }
        throw new Error('Failed to fetch availability')
      }

      const data: WeeklyAvailabilityResponse = await res.json()
      setAvailabilityData(data.days)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching weekly availability:', err)
      // Retry on network errors
      if (retryCount < maxRetries) {
        setTimeout(() => fetchWeeklyAvailability(weekStart, retryCount + 1), 1000)
        return
      }
      setError(t('fetchError') || 'Failed to load schedule')
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchWeeklyAvailability(currentWeekStart)
  }, [currentWeekStart, fetchWeeklyAvailability])

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1))
  }

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()))
  }

  const handleSlotClick = (date: Date, time: string) => {
    onSlotSelect(date, time)
  }

  const weekDays = getWeekDays(currentWeekStart)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <WeekNavigator
          currentWeekStart={currentWeekStart}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            {error}
          </div>
        ) : (
          <TimetableGrid
            weekDays={weekDays}
            availabilityData={availabilityData}
            onSlotClick={handleSlotClick}
            onAcceptSuggestion={onAcceptSuggestion}
            onCounterSuggestion={onCounterSuggestion}
          />
        )}

        <p className="text-xs text-gray-500 mt-3 text-center">
          {t('clickToBook')}
        </p>
      </CardContent>
    </Card>
  )
}

export { WeekNavigator } from './WeekNavigator'
export { TimetableGrid } from './TimetableGrid'
export { TimetableSlot } from './TimetableSlot'
