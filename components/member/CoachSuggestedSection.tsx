'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { getLessonPrice } from '@/lib/lesson-config'

interface LessonRequest {
  id: string
  requestedDate: string
  requestedTime: string
  lessonType: string
  requestedDuration: number
  status: string
  adminNotes: string | null
  suggestedTime: string | null
  createdAt: string
}

interface CoachSuggestedSectionProps {
  requests: LessonRequest[]
  onAccept: (requestId: string) => void
  onCounterPropose: (requestId: string) => void
  submitting: boolean
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function CoachSuggestedSection({
  requests,
  onAccept,
  onCounterPropose,
  submitting,
}: CoachSuggestedSectionProps) {
  const t = useTranslations('member')

  if (requests.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 border-blue-300">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          {t('coachSuggested.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(request.requestedDate), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.lessonType.replace(/-/g, ' ')} {t('lesson')} ({request.requestedDuration}hr)
                  </p>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  RM{getLessonPrice(request.lessonType, request.requestedDuration)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-2 bg-white rounded border">
                  <p className="text-xs text-gray-500">{t('coachSuggested.yourTime')}</p>
                  <p className="font-medium text-gray-400 line-through">{formatTime(request.requestedTime)}</p>
                </div>
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-xs text-green-600">{t('coachSuggested.coachSuggests')}</p>
                  <p className="font-medium text-green-700">
                    {request.suggestedTime ? formatTime(request.suggestedTime) : 'N/A'}
                  </p>
                </div>
              </div>

              {request.adminNotes && (
                <p className="text-sm text-gray-600 mb-3 italic">
                  {t('coachSuggested.coachNote')}: {request.adminNotes}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAccept(request.id)}
                  disabled={submitting}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('coachSuggested.acceptTime')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCounterPropose(request.id)}
                  disabled={submitting}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {t('coachSuggested.suggestDifferent')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
