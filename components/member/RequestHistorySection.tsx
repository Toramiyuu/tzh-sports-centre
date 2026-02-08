'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

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

interface RequestHistorySectionProps {
  requests: LessonRequest[]
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function RequestHistorySection({ requests }: RequestHistorySectionProps) {
  const t = useTranslations('member')

  const getStatusBadge = (reqStatus: string) => {
    switch (reqStatus) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('status.pending')}
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('status.approved')}
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            {t('status.rejected')}
          </Badge>
        )
      case 'changed':
        return (
          <Badge className="bg-secondary text-foreground border-0">
            <ArrowRight className="w-3 h-3 mr-1" />
            {t('status.timeChanged')}
          </Badge>
        )
      default:
        return <Badge variant="outline">{reqStatus}</Badge>
    }
  }

  // Filter to show only non-pending and non-changed requests
  const historyRequests = requests.filter(r => r.status !== 'pending' && r.status !== 'changed')

  return (
    <Card className="border border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{t('requestHistory')}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('requestHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {historyRequests.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {t('noRequestHistory')}
          </p>
        ) : (
          <div className="space-y-3">
            {historyRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 bg-background rounded-xl border border-border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(request.requestedDate), 'MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(request.requestedTime)} - {request.lessonType.replace(/-/g, ' ')} {t('lesson')}
                    </p>
                    {request.adminNotes && (
                      <p className="text-sm text-muted-foreground mt-1">{t('coach')}: {request.adminNotes}</p>
                    )}
                    {request.suggestedTime && (
                      <p className="text-sm text-foreground mt-1">{t('suggested')}: {formatTime(request.suggestedTime)}</p>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
