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
    <Card className="mb-6 border border-border rounded-2xl">
      <CardHeader className="bg-background rounded-t-2xl">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          {t('coachSuggested.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 bg-background rounded-xl border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">
                    {format(new Date(request.requestedDate), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.lessonType.replace(/-/g, ' ')} {t('lesson')} ({request.requestedDuration}hr)
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  RM{getLessonPrice(request.lessonType, request.requestedDuration)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-2 bg-white rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{t('coachSuggested.yourTime')}</p>
                  <p className="font-medium text-muted-foreground line-through">{formatTime(request.requestedTime)}</p>
                </div>
                <div className="p-2 bg-secondary rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">{t('coachSuggested.coachSuggests')}</p>
                  <p className="font-medium text-foreground">
                    {request.suggestedTime ? formatTime(request.suggestedTime) : 'N/A'}
                  </p>
                </div>
              </div>

              {request.adminNotes && (
                <p className="text-sm text-muted-foreground mb-3 italic">
                  {t('coachSuggested.coachNote')}: {request.adminNotes}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-foreground hover:bg-foreground/90 rounded-full"
                  onClick={() => onAccept(request.id)}
                  disabled={submitting}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('coachSuggested.acceptTime')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
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
