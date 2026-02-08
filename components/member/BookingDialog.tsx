'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import {
  LESSON_TYPES,
  getLessonType,
  getLessonPrice,
  getDefaultDuration,
  getDurationOptions,
  getPricePerPerson,
} from '@/lib/lesson-config'
import { formatDateString } from '@/lib/timetable-utils'

// Only per-session lesson types for member requests (monthly = admin only)
const MEMBER_LESSON_TYPES = LESSON_TYPES.filter(t => t.billingType === 'per_session')

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedTime: string | null
  onSubmit: (data: {
    requestedDate: string
    requestedTime: string
    lessonType: string
    requestedDuration: number
  }) => Promise<boolean>
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function BookingDialog({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onSubmit,
}: BookingDialogProps) {
  const t = useTranslations('member.dialog')
  const tCommon = useTranslations('member')
  const tLessons = useTranslations('lessons.types')

  const [lessonType, setLessonType] = useState('')
  const [duration, setDuration] = useState<number>(1.5)
  const [submitting, setSubmitting] = useState(false)

  // Reset form when dialog opens with new selection
  useEffect(() => {
    if (open) {
      setLessonType('')
      setDuration(1.5)
    }
  }, [open, selectedDate, selectedTime])

  const handleTypeChange = (value: string) => {
    setLessonType(value)
    setDuration(getDefaultDuration(value))
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !lessonType) return

    setSubmitting(true)
    try {
      const success = await onSubmit({
        requestedDate: formatDateString(selectedDate),
        requestedTime: selectedTime,
        lessonType,
        requestedDuration: duration,
      })

      if (success) {
        onOpenChange(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTypeConfig = lessonType ? getLessonType(lessonType) : null
  const durationOptions = lessonType ? getDurationOptions(lessonType) : []
  const price = lessonType ? getLessonPrice(lessonType, duration) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Date & Time Display */}
          {selectedDate && selectedTime && (
            <div className="p-3 bg-background rounded-xl border border-border">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatTime(selectedTime)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Lesson Type Selector */}
          <div className="space-y-2">
            <Label>{t('lessonType')}</Label>
            <Select value={lessonType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectLessonType')} />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_LESSON_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {tLessons(type.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selector */}
          {lessonType && durationOptions.length > 0 && (
            <div className="space-y-2">
              <Label>{t('duration')}</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectDuration')} />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label} - RM{opt.price}
                      {opt.pricePerPerson && ` (RM${opt.pricePerPerson}/person)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Summary */}
          {lessonType && selectedTypeConfig && (
            <div className="p-3 bg-secondary rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {tLessons(lessonType)} - {duration} {t('hours', { count: duration })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max {selectedTypeConfig.maxStudents} student(s)
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const perPersonPrice = getPricePerPerson(lessonType, duration)
                    if (perPersonPrice && selectedTypeConfig.maxStudents > 1) {
                      return (
                        <>
                          <p className="text-lg font-bold text-foreground">
                            RM{perPersonPrice} / person
                          </p>
                          <p className="text-xs text-muted-foreground">
                            (Total: RM{price})
                          </p>
                        </>
                      )
                    }
                    return (
                      <p className="text-lg font-bold text-foreground">
                        RM{price}
                      </p>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!lessonType || submitting}
            className="bg-foreground hover:bg-foreground/90 rounded-full"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
