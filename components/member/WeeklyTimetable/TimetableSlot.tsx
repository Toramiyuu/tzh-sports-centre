'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { SlotStatus, slotStatusStyles } from '@/lib/timetable-utils'
import { useTranslations } from 'next-intl'

interface TimetableSlotProps {
  status: SlotStatus
  lessonType?: string
  onClick?: () => void
  isFirstSlotOfLesson?: boolean
  lessonSpanSlots?: number
}

export const TimetableSlot = memo(function TimetableSlot({
  status,
  lessonType,
  onClick,
  isFirstSlotOfLesson = false,
  lessonSpanSlots = 1,
}: TimetableSlotProps) {
  const t = useTranslations('member.timetable')
  const styles = slotStatusStyles[status]

  const isClickable = status === 'available'
  const showLabel = isFirstSlotOfLesson || status === 'available' || status === 'my-pending'

  // Format lesson type for display
  const formatLessonType = (type: string) => {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return t('available')
      case 'booked':
        return lessonType ? formatLessonType(lessonType) : t('booked')
      case 'my-lesson':
        return lessonType ? formatLessonType(lessonType) : t('myLesson')
      case 'my-pending':
        return lessonType ? formatLessonType(lessonType) : t('myPending')
      case 'unavailable':
        return ''
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        'min-h-[40px] border-b border-r p-1 transition-colors relative',
        styles.bg,
        styles.border,
        styles.text,
        styles.hover,
        !isClickable && 'cursor-default'
      )}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      } : undefined}
    >
      {showLabel && (
        <span className="text-xs truncate block">
          {getStatusLabel()}
        </span>
      )}
      {status === 'my-lesson' && isFirstSlotOfLesson && lessonSpanSlots > 1 && (
        <div
          className={cn(
            'absolute inset-x-0 top-0 rounded-sm z-10 flex items-start justify-center p-1',
            styles.bg,
            'border',
            styles.border
          )}
          style={{ height: `${lessonSpanSlots * 40}px` }}
        >
          <span className="text-xs font-medium truncate">
            {lessonType ? formatLessonType(lessonType) : t('myLesson')}
          </span>
        </div>
      )}
    </div>
  )
})
