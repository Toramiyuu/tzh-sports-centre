'use client'

import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { TimetableSlot } from './TimetableSlot'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Clock, MessageCircle } from 'lucide-react'
import {
  generateTimeSlots,
  getSlotStatus,
  isPastDate,
  DayData,
  DayAvailability,
  CoachSuggestedRequest,
} from '@/lib/timetable-utils'
import { useTranslations } from 'next-intl'

interface TimetableGridProps {
  weekDays: DayData[]
  availabilityData: Record<string, DayAvailability>
  onSlotClick: (date: Date, time: string) => void
  onAcceptSuggestion?: (requestId: string) => void
  onCounterSuggestion?: (requestId: string) => void
}

export function TimetableGrid({
  weekDays,
  availabilityData,
  onSlotClick,
  onAcceptSuggestion,
  onCounterSuggestion,
}: TimetableGridProps) {
  const t = useTranslations('member.timetable')
  const tDays = useTranslations('days')
  const timeSlots = generateTimeSlots()

  // State for coach suggestion dialog
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<CoachSuggestedRequest | null>(null)

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Format lesson type for display
  const formatLessonType = (type: string) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Handle clicking on a coach-suggested slot
  const handleSuggestionClick = (suggestion: CoachSuggestedRequest) => {
    setSelectedSuggestion(suggestion)
    setSuggestionDialogOpen(true)
  }

  return (
    <div className="relative border rounded-lg overflow-hidden">
      {/* Scroll container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-8 border-b bg-neutral-50">
            {/* Time column header */}
            <div className="sticky left-0 z-20 bg-neutral-50 border-r p-2 text-center text-sm font-medium text-neutral-500">
              {t('time') || 'Time'}
            </div>
            {/* Day headers */}
            {weekDays.map((day) => (
              <div
                key={day.dateString}
                className={cn(
                  'p-2 text-center border-r last:border-r-0',
                  day.isToday && 'bg-neutral-50'
                )}
              >
                <div className={cn(
                  'font-medium text-sm',
                  day.isToday ? 'text-neutral-700' : 'text-neutral-900'
                )}>
                  {tDays(day.dayName.toLowerCase())}
                </div>
                <div className={cn(
                  'text-xs',
                  day.isToday ? 'text-neutral-900' : 'text-neutral-500'
                )}>
                  {day.date.getDate()}/{day.date.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-cols-8">
            {timeSlots.map((slot) => (
              <Fragment key={slot.time}>
                {/* Time column */}
                <div className="sticky left-0 z-10 bg-white border-r border-b p-1 text-xs text-neutral-500 text-right pr-2 flex items-center justify-end min-h-[40px]">
                  {slot.displayName}
                </div>
                {/* Day columns */}
                {weekDays.map((day) => {
                  const dayData = availabilityData[day.dateString]
                  const past = isPastDate(day.date)
                  const slotInfo = getSlotStatus(slot.time, dayData, past)

                  // Special rendering for coach-suggested slots - show key details
                  if (slotInfo.status === 'coach-suggested' && slotInfo.coachSuggestion) {
                    const suggestion = slotInfo.coachSuggestion
                    const isFirstSlot = slot.time === suggestion.suggestedTime

                    return (
                      <div
                        key={`${day.dateString}-${slot.time}`}
                        className={cn(
                          'min-h-[40px] border-b border-r transition-all',
                          'bg-gradient-to-r from-purple-100 to-purple-50',
                          'border-l-4 border-l-purple-500',
                          isFirstSlot && 'cursor-pointer hover:from-purple-200 hover:to-purple-100'
                        )}
                        onClick={isFirstSlot ? () => handleSuggestionClick(suggestion) : undefined}
                        role={isFirstSlot ? 'button' : undefined}
                        tabIndex={isFirstSlot ? 0 : undefined}
                      >
                        {isFirstSlot && (
                          <div className="h-full flex flex-col justify-center p-1.5">
                            <div className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">
                              Coach suggests
                            </div>
                            <div className="text-xs font-semibold text-purple-800 truncate">
                              {formatLessonType(suggestion.lessonType)}
                            </div>
                            <div className="text-[10px] text-purple-600">
                              Was: {formatTime(suggestion.originalTime)} → Tap to respond
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <TimetableSlot
                      key={`${day.dateString}-${slot.time}`}
                      status={slotInfo.status}
                      lessonType={slotInfo.lessonType}
                      onClick={() => onSlotClick(day.date, slot.time)}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 border-t bg-neutral-50 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
          <span className="text-neutral-600">{t('available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-200" />
          <span className="text-neutral-600">{t('booked')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-300" />
          <span className="text-neutral-600">{t('myLesson')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-neutral-600">{t('myPending')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
          <span className="text-neutral-600">{t('coachSuggested') || 'Coach Suggested'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-neutral-50 border border-neutral-100" />
          <span className="text-neutral-600">{t('unavailable')}</span>
        </div>
      </div>

      {/* Coach Suggestion Response Dialog */}
      <Dialog open={suggestionDialogOpen} onOpenChange={setSuggestionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <MessageCircle className="w-5 h-5" />
              {t('suggestionDialog.title') || 'Coach Suggested New Time'}
            </DialogTitle>
            <DialogDescription>
              {t('suggestionDialog.description') || 'Your coach has suggested a different time for your lesson.'}
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-4 py-2">
              {/* Original vs Suggested comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-xs text-neutral-500 mb-1">{t('suggestionDialog.yourRequest') || 'Your request'}</p>
                  <p className="font-medium text-neutral-400 line-through">
                    {formatTime(selectedSuggestion.originalTime)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">{t('suggestionDialog.suggested') || 'Suggested'}</p>
                  <p className="font-semibold text-purple-700">
                    {formatTime(selectedSuggestion.suggestedTime)}
                  </p>
                </div>
              </div>

              {/* Lesson details */}
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">{formatLessonType(selectedSuggestion.lessonType)}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedSuggestion.requestedDuration} hour(s)</span>
                </p>
              </div>

              {/* Coach notes if any */}
              {selectedSuggestion.adminNotes && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-neutral-900 mb-1">{t('suggestionDialog.coachNote') || 'Note from coach'}</p>
                  <p className="text-sm text-blue-800">{selectedSuggestion.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setSuggestionDialogOpen(false)
                if (selectedSuggestion) {
                  onCounterSuggestion?.(selectedSuggestion.id)
                }
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              {t('suggestionDialog.suggestDifferent') || 'Suggest Different Time'}
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedSuggestion) {
                  onAcceptSuggestion?.(selectedSuggestion.id)
                  setSuggestionDialogOpen(false)
                }
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              {t('suggestionDialog.accept') || 'Accept This Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
