'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

interface Lesson {
  id: string
  lessonDate: string
  startTime: string
  endTime: string
  lessonType: string
  duration: number
  price: number
  status: string
  notes: string | null
  court: { name: string }
  students: { id: string; name: string }[]
}

interface UpcomingLessonsSectionProps {
  lessons: Lesson[]
  currentUserName: string | null | undefined
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function UpcomingLessonsSection({
  lessons,
  currentUserName,
}: UpcomingLessonsSectionProps) {
  const t = useTranslations('member')

  const getLessonStatusBadge = (lessonStatus: string) => {
    switch (lessonStatus) {
      case 'scheduled':
        return <Badge className="bg-neutral-100 text-neutral-700 border-0">{t('status.scheduled')}</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-0">{t('status.completed')}</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-0">{t('status.cancelled')}</Badge>
      default:
        return <Badge variant="outline">{lessonStatus}</Badge>
    }
  }

  return (
    <Card className="mb-6 border border-neutral-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-neutral-900">
          <Calendar className="w-5 h-5 text-neutral-600" />
          {t('upcomingLessons')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-center py-8 text-neutral-500">
            {t('noUpcomingLessons')}
          </p>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {format(new Date(lesson.lessonDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)} ({lesson.duration}h)
                    </p>
                    <p className="text-sm text-neutral-600">
                      {lesson.court.name} - {lesson.lessonType.replace(/-/g, ' ')} {t('lesson')}
                    </p>
                    {lesson.students.length > 1 && (
                      <p className="text-sm text-neutral-500 mt-1">
                        {t('with')}: {lesson.students.filter(s => s.name !== currentUserName).map(s => s.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {getLessonStatusBadge(lesson.status)}
                    <p className="text-sm font-medium text-neutral-900 mt-2">RM{lesson.price}</p>
                  </div>
                </div>
                {lesson.notes && (
                  <p className="text-sm text-neutral-500 mt-2 italic">{t('note')}: {lesson.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
