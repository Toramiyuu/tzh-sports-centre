'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
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
import { GraduationCap, Loader2, Plus, Clock, CalendarCheck, BookOpen, Users, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { startOfDay, isBefore, format } from 'date-fns'

import { WeeklyTimetable } from './WeeklyTimetable'
import { StatsCards } from './StatsCards'
import { CoachSuggestedSection } from './CoachSuggestedSection'
import { PendingRequestsSection } from './PendingRequestsSection'
import { UpcomingLessonsSection } from './UpcomingLessonsSection'
import { RequestHistorySection } from './RequestHistorySection'
import { BookingDialog } from './BookingDialog'

// Time slots for counter-propose dialog
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minutes = i % 2 === 0 ? '00' : '30'
  const slotTime = `${hour.toString().padStart(2, '0')}:${minutes}`
  const ampm = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour <= 12 ? hour : hour - 12
  return { slotTime, displayName: `${displayHour}:${minutes} ${ampm}` }
})

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

export function MemberDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('member')

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [requests, setRequests] = useState<LessonRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Booking dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Counter-propose dialog state
  const [counterDialogOpen, setCounterDialogOpen] = useState(false)
  const [counterRequestId, setCounterRequestId] = useState<string | null>(null)
  const [counterDate, setCounterDate] = useState<Date | undefined>(undefined)
  const [counterTime, setCounterTime] = useState('')

  // Key to force timetable refetch
  const [timetableKey, setTimetableKey] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/member')
      return
    }
    checkMemberStatus()
  }, [session, status, router])

  const checkMemberStatus = async () => {
    try {
      const res = await fetch('/api/member/lessons')
      if (res.status === 403) {
        setIsMember(false)
        setLoading(false)
        return
      }
      if (res.ok) {
        setIsMember(true)
        const data = await res.json()
        setLessons(data.lessons || [])
        fetchRequests()
      }
    } catch (error) {
      console.error('Error checking member status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/member/requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const refreshData = useCallback(() => {
    checkMemberStatus()
    setTimetableKey(prev => prev + 1)
  }, [])

  const handleSlotSelect = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setBookingDialogOpen(true)
  }

  const handleBookingSubmit = async (data: {
    requestedDate: string
    requestedTime: string
    lessonType: string
    requestedDuration: number
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/member/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        refreshData()
        return true
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to submit request')
        return false
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
      return false
    }
  }

  const cancelRequest = async (requestId: string) => {
    if (!confirm(t('cancelConfirm'))) return

    try {
      const res = await fetch('/api/member/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (res.ok) {
        refreshData()
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
    }
  }

  const acceptSuggestedTime = async (requestId: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/member/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'accept' }),
      })

      if (res.ok) {
        refreshData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to accept time')
      }
    } catch (error) {
      console.error('Error accepting time:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Open counter-propose dialog
  const counterProposeTime = (requestId: string) => {
    // Find the request to get default values
    const request = requests.find(r => r.id === requestId)
    if (request) {
      // Parse the suggested time if available
      if (request.suggestedTime) {
        const [datePart, timePart] = request.suggestedTime.split(' ')
        setCounterDate(new Date(datePart))
        setCounterTime(timePart || '')
      } else {
        setCounterDate(new Date(request.requestedDate))
        setCounterTime(request.requestedTime)
      }
    } else {
      setCounterDate(new Date())
      setCounterTime('')
    }
    setCounterRequestId(requestId)
    setCounterDialogOpen(true)
  }

  // Submit counter proposal
  const submitCounterProposal = async () => {
    if (!counterRequestId || !counterDate || !counterTime) return

    setSubmitting(true)
    try {
      const newDateTime = `${format(counterDate, 'yyyy-MM-dd')} ${counterTime}`
      const res = await fetch('/api/member/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: counterRequestId, action: 'counter', newTime: newDateTime }),
      })

      if (res.ok) {
        setCounterDialogOpen(false)
        refreshData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to suggest new time')
      }
    } catch (error) {
      console.error('Error suggesting time:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter lessons and requests
  const today = startOfDay(new Date())
  const upcomingLessons = lessons.filter(l => !isBefore(new Date(l.lessonDate), today) && l.status === 'scheduled')
  const pastLessons = lessons.filter(l => isBefore(new Date(l.lessonDate), today) || l.status !== 'scheduled')
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const suggestedRequests = requests.filter(r => r.status === 'changed')
  const completedCount = pastLessons.filter(l => l.status === 'completed').length

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  // Show membership benefits if not a confirmed member
  if (isMember !== true) {
    const benefits = [
      { icon: CalendarCheck, title: t('membersOnly.benefits.scheduling.title'), desc: t('membersOnly.benefits.scheduling.desc') },
      { icon: BookOpen, title: t('membersOnly.benefits.lessons.title'), desc: t('membersOnly.benefits.lessons.desc') },
      { icon: Users, title: t('membersOnly.benefits.timetable.title'), desc: t('membersOnly.benefits.timetable.desc') },
      { icon: Clock, title: t('membersOnly.benefits.recurring.title'), desc: t('membersOnly.benefits.recurring.desc') },
    ]

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-neutral-600" />
          </div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{t('membersOnly.title')}</h2>
          <p className="text-neutral-500">
            {t('membersOnly.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {benefits.map((benefit, i) => (
            <Card key={i} className="border border-neutral-200 rounded-2xl">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">{benefit.title}</h3>
                  <p className="text-neutral-500 text-sm mt-1">{benefit.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-3">
          <a
            href="https://wa.me/60117575508?text=Hi%2C%20I%27m%20interested%20in%20becoming%20a%20training%20member"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {t('membersOnly.enquire')}
          </a>
          <div>
            <Button onClick={() => router.push('/')} variant="outline" className="mt-2 rounded-full">
              {t('membersOnly.backToHome')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{t('title')}</h1>
            <p className="text-neutral-500">{t('welcome', { name: session?.user?.name || '' })}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        upcomingCount={upcomingLessons.length}
        pendingCount={pendingRequests.length}
        completedCount={completedCount}
      />

      {/* Weekly Timetable */}
      <div className="mb-6">
        <WeeklyTimetable
          key={timetableKey}
          onSlotSelect={handleSlotSelect}
          onAcceptSuggestion={acceptSuggestedTime}
          onCounterSuggestion={counterProposeTime}
        />
      </div>

      {/* Coach Suggested Times - Now hidden since shown in timetable, kept as fallback */}
      {suggestedRequests.length > 0 && (
        <CoachSuggestedSection
          requests={suggestedRequests}
          onAccept={acceptSuggestedTime}
          onCounterPropose={counterProposeTime}
          submitting={submitting}
        />
      )}

      {/* Pending Requests */}
      <PendingRequestsSection
        requests={pendingRequests}
        onCancel={cancelRequest}
      />

      {/* Upcoming Lessons */}
      <UpcomingLessonsSection
        lessons={upcomingLessons}
        currentUserName={session?.user?.name}
      />

      {/* Request History */}
      <RequestHistorySection requests={requests} />

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSubmit={handleBookingSubmit}
      />

      {/* Counter-Propose Time Dialog */}
      <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-neutral-900">
              <Clock className="w-5 h-5 text-neutral-600" />
              {t('counterPropose.title') || 'Suggest Different Time'}
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              {t('counterPropose.description') || 'Suggest an alternative date and time for your lesson.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-neutral-700">{t('counterPropose.date') || 'Date'}</Label>
              <div className="border border-neutral-200 rounded-xl p-3">
                <Calendar
                  mode="single"
                  selected={counterDate}
                  onSelect={setCounterDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="mx-auto"
                />
              </div>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-neutral-700">{t('counterPropose.time') || 'Time'}</Label>
              <Select value={counterTime} onValueChange={setCounterTime}>
                <SelectTrigger className="border-neutral-200 rounded-lg">
                  <SelectValue placeholder={t('counterPropose.selectTime') || 'Select time'} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.slotTime} value={slot.slotTime}>
                      {slot.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {counterDate && counterTime && (
              <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200">
                <p className="text-sm text-neutral-600 mb-1">{t('counterPropose.yourSuggestion') || 'Your suggestion'}:</p>
                <p className="font-medium text-neutral-900">
                  {format(counterDate, 'EEEE, MMMM d, yyyy')} at{' '}
                  {TIME_SLOTS.find(s => s.slotTime === counterTime)?.displayName || counterTime}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCounterDialogOpen(false)} className="rounded-full">
              {t('dialog.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={submitCounterProposal}
              disabled={submitting || !counterDate || !counterTime}
              className="bg-neutral-900 hover:bg-neutral-800 rounded-full"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('counterPropose.submit') || 'Send Suggestion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
