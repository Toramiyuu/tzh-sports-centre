'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GraduationCap,
  Clock,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  RefreshCw,
  CalendarDays,
  Users,
  DollarSign,
  Check,
  LayoutGrid,
  List,
  Repeat,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  LESSON_TYPES,
  getLessonType,
  getLessonPrice,
  getDefaultDuration,
  isMonthlyBilling,
  getDurationOptions,
  type LessonTypeConfig,
} from '@/lib/lesson-config'

const DAYS_OF_WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Generate time slots from 9 AM to 11 PM in 30-min increments
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minutes = i % 2 === 0 ? '00' : '30'
  const slotTime = `${hour.toString().padStart(2, '0')}:${minutes}`
  const ampm = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour <= 12 ? hour : hour - 12
  return { slotTime, displayName: `${displayHour}:${minutes} ${ampm}` }
})

// Format time slot to show 30-min range (e.g., "9:00 AM" -> "9:00 - 9:30 AM")
const formatTimeRange = (displayName: string): string => {
  const match = displayName.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return displayName

  const hour = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()

  // Calculate end time (30 minutes later)
  let endMinutes = minutes + 30
  let endHour = hour
  let endPeriod = period

  if (endMinutes >= 60) {
    endMinutes = 0
    endHour = hour + 1
    if (hour === 11 && period === 'AM') {
      endPeriod = 'PM'
    } else if (hour === 11 && period === 'PM') {
      endPeriod = 'AM'
    } else if (hour === 12) {
      endHour = 1
    }
  }

  const startStr = `${hour}:${minutes.toString().padStart(2, '0')}`
  const endStr = `${endHour}:${endMinutes.toString().padStart(2, '0')}`
  return `${startStr} - ${endStr} ${endPeriod}`
}

interface CoachAvailability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
}

interface Member {
  id: string
  name: string
  phone: string
  skillLevel: string | null
}

interface Court {
  id: number
  name: string
}

interface LessonSession {
  id: string
  courtId: number
  lessonDate: string
  startTime: string
  endTime: string
  lessonType: string
  duration: number
  price: number
  status: string
  notes: string | null
  court: Court
  students: Member[]
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
  member: {
    id: string
    name: string
    email: string
    phone: string
    skillLevel: string | null
  }
}

interface BookingSlot {
  courtId: number
  startTime: string
  guestName?: string
  userName?: string
  isRecurring?: boolean
  recurringLabel?: string
}

export default function AdminLessonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('admin.lessonManagement')
  const tAdmin = useTranslations('admin')
  const tDays = useTranslations('days')

  // Create translated DAYS_OF_WEEK array
  const DAYS_OF_WEEK = DAYS_OF_WEEK_KEYS.map(key => tDays(key))

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'billing' | 'requests'>('schedule')

  // Data states
  const [coachAvailability, setCoachAvailability] = useState<CoachAvailability[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [lessons, setLessons] = useState<LessonSession[]>([])
  const [lessonRequests, setLessonRequests] = useState<LessonRequest[]>([])
  const [bookedSlots, setBookedSlots] = useState<BookingSlot[]>([])

  // Calendar & Filter states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [billingMonth, setBillingMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Dialog states
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LessonRequest | null>(null)
  const [approveCourtId, setApproveCourtId] = useState<number | null>(null)
  const [courtAvailability, setCourtAvailability] = useState<Record<number, boolean>>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Form states for availability
  const [availDays, setAvailDays] = useState<number[]>([])
  const [availStartTime, setAvailStartTime] = useState('')
  const [availEndTime, setAvailEndTime] = useState('')

  // Form states for lesson
  const [lessonCourtId, setLessonCourtId] = useState<number | null>(null)
  const [lessonStartTime, setLessonStartTime] = useState('')
  const [lessonType, setLessonType] = useState('')
  const [lessonDuration, setLessonDuration] = useState<number>(1.5)
  const [lessonStudentIds, setLessonStudentIds] = useState<string[]>([])
  const [lessonNotes, setLessonNotes] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email)) {
      router.push('/')
    }
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [availRes, membersRes, courtsRes, lessonsRes, requestsRes] = await Promise.all([
        fetch('/api/admin/coach-availability'),
        fetch('/api/admin/members'),
        fetch('/api/courts'),
        fetch(`/api/admin/lessons?date=${format(selectedDate, 'yyyy-MM-dd')}`),
        fetch('/api/admin/lesson-requests'),
      ])

      const [availData, membersData, courtsData, lessonsData, requestsData] = await Promise.all([
        availRes.json(),
        membersRes.json(),
        courtsRes.json(),
        lessonsRes.json(),
        requestsRes.json(),
      ])

      setCoachAvailability(availData.availability || [])
      setMembers(membersData.members || [])
      setCourts(courtsData.courts || [])
      setLessons(lessonsData.lessons || [])
      setLessonRequests(requestsData.requests || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/lesson-requests')
      const data = await res.json()
      setLessonRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleRequestAction = async (requestId: string, status: string, adminNotes?: string, suggestedTime?: string, courtId?: number) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/lesson-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, adminNotes, suggestedTime, courtId }),
      })
      if (res.ok) {
        fetchRequests()
        // If approving, also refresh lessons for the schedule tab
        if (status === 'approved') {
          fetchLessonsForDate()
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update request')
      }
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const openApproveDialog = async (request: LessonRequest) => {
    setSelectedRequest(request)
    setApproveCourtId(null)
    setApproveDialogOpen(true)
    setLoadingAvailability(true)

    // Fetch availability for the requested date and time
    try {
      const dateStr = format(new Date(request.requestedDate), 'yyyy-MM-dd')
      const res = await fetch(`/api/availability?date=${dateStr}`)
      const data = await res.json()

      // Check which courts are available at the requested time
      // Use the requestedDuration from the request
      const duration = request.requestedDuration || 1.5
      const slotsNeeded = duration * 2 // 30-min slots

      const availability: Record<number, boolean> = {}

      // Also check existing lessons for conflicts
      const lessonsRes = await fetch(`/api/admin/lessons?date=${dateStr}`)
      const lessonsData = await lessonsRes.json()
      const existingLessons = lessonsData.lessons || []

      // Calculate the end time for the requested lesson
      const [startHours, startMinutes] = request.requestedTime.split(':').map(Number)
      const durationMinutes = duration * 60
      const endTotalMinutes = startHours * 60 + startMinutes + durationMinutes
      const endHours = Math.floor(endTotalMinutes / 60)
      const endMinutes = endTotalMinutes % 60
      const requestedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`

      // Check each court
      if (data.courts) {
        data.courts.forEach((court: { id: number }) => {
          // First, check if there's a booking conflict using availability data
          let hasBookingConflict = false
          const courtAvailData = data.availability?.find((ca: { court: { id: number } }) => ca.court.id === court.id)

          if (courtAvailData) {
            const startIdx = courtAvailData.slots.findIndex((s: { slotTime: string }) => s.slotTime === request.requestedTime)
            if (startIdx !== -1) {
              // Time slot exists in booking hours - check availability
              for (let i = 0; i < slotsNeeded && startIdx + i < courtAvailData.slots.length; i++) {
                if (!courtAvailData.slots[startIdx + i].available) {
                  hasBookingConflict = true
                  break
                }
              }
            }
            // If slot not found, it's outside booking hours (before 3 PM) - no booking conflict
          }

          // Second, check for lesson conflicts
          let hasLessonConflict = false
          existingLessons.forEach((lesson: { courtId: number; startTime: string; endTime: string; status: string }) => {
            if (lesson.courtId === court.id && lesson.status === 'scheduled') {
              // Check time overlap
              const lessonStart = lesson.startTime
              const lessonEnd = lesson.endTime
              // Overlap if: requestedStart < lessonEnd AND requestedEnd > lessonStart
              if (request.requestedTime < lessonEnd && requestedEndTime > lessonStart) {
                hasLessonConflict = true
              }
            }
          })

          availability[court.id] = !hasBookingConflict && !hasLessonConflict
        })
      }

      setCourtAvailability(availability)
    } catch (error) {
      console.error('Error fetching availability:', error)
      // On error, default all courts to available
      const defaultAvail: Record<number, boolean> = {}
      courts.forEach(c => { defaultAvail[c.id] = true })
      setCourtAvailability(defaultAvail)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleApproveWithCourt = async () => {
    if (!selectedRequest || !approveCourtId) return
    await handleRequestAction(selectedRequest.id, 'approved', undefined, undefined, approveCourtId)
    setApproveDialogOpen(false)
    setSelectedRequest(null)
    setApproveCourtId(null)
    setCourtAvailability({})
  }

  const fetchLessonsForDate = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      // Fetch both lessons and bookings in parallel
      const [lessonsRes, bookingsRes] = await Promise.all([
        fetch(`/api/admin/lessons?date=${dateStr}`),
        fetch(`/api/admin/bookings?date=${dateStr}`),
      ])

      const lessonsData = await lessonsRes.json()
      const bookingsData = await bookingsRes.json()

      setLessons(lessonsData.lessons || [])

      // Extract booked slots from bookings data
      const slots: BookingSlot[] = []

      // Regular bookings
      if (bookingsData.bookings) {
        bookingsData.bookings.forEach((booking: { courtId: number; startTime: string; guestName?: string; user?: { name: string } }) => {
          slots.push({
            courtId: booking.courtId,
            startTime: booking.startTime,
            guestName: booking.guestName,
            userName: booking.user?.name,
          })
        })
      }

      // Recurring bookings
      if (bookingsData.recurringBookings) {
        bookingsData.recurringBookings.forEach((recurring: { courtId: number; startTime: string; label?: string; guestName?: string; user?: { name: string } }) => {
          slots.push({
            courtId: recurring.courtId,
            startTime: recurring.startTime,
            guestName: recurring.guestName,
            userName: recurring.user?.name,
            isRecurring: true,
            recurringLabel: recurring.label,
          })
        })
      }

      setBookedSlots(slots)
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
  }

  const fetchBillingData = async () => {
    try {
      const res = await fetch(`/api/admin/lessons?month=${billingMonth}`)
      const data = await res.json()
      setLessons(data.lessons || [])
    } catch (error) {
      console.error('Error fetching billing data:', error)
    }
  }

  // Create a map of lessons by court and time slot for grid view
  const createLessonMap = () => {
    const map: Record<string, LessonSession> = {}
    lessons.filter(l => l.status !== 'cancelled').forEach((lesson) => {
      // For each lesson, mark all 30-min slots it occupies
      const startIdx = TIME_SLOTS.findIndex(s => s.slotTime === lesson.startTime)
      const endIdx = TIME_SLOTS.findIndex(s => s.slotTime === lesson.endTime)
      if (startIdx !== -1) {
        const endIndex = endIdx !== -1 ? endIdx : TIME_SLOTS.length
        for (let i = startIdx; i < endIndex; i++) {
          const key = `${lesson.courtId}-${TIME_SLOTS[i].slotTime}`
          map[key] = lesson
        }
      }
    })
    return map
  }

  // Create a map of bookings by court and time slot for grid view
  const createBookingMap = () => {
    const map: Record<string, BookingSlot> = {}
    bookedSlots.forEach((slot) => {
      const key = `${slot.courtId}-${slot.startTime}`
      map[key] = slot
    })
    return map
  }

  const lessonMap = createLessonMap()
  const bookingMap = createBookingMap()

  // Open add lesson dialog with pre-selected court and time
  const openAddLessonDialog = (courtId: number, slotTime: string) => {
    setLessonCourtId(courtId)
    setLessonStartTime(slotTime)
    setLessonDialogOpen(true)
  }

  useEffect(() => {
    if (session?.user && isAdmin(session.user.email)) {
      fetchData()
    }
  }, [session])

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchLessonsForDate()
    } else if (activeTab === 'billing') {
      fetchBillingData()
    }
  }, [selectedDate, billingMonth, activeTab])

  const handleAddAvailability = async () => {
    if (availDays.length === 0 || !availStartTime || !availEndTime) {
      alert('Please select days, start time, and end time')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/coach-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysOfWeek: availDays,
          startTime: availStartTime,
          endTime: availEndTime,
          isRecurring: true,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setAvailabilityDialogOpen(false)
        setAvailDays([])
        setAvailStartTime('')
        setAvailEndTime('')
        fetchData()
      } else {
        alert(data.error || 'Failed to add availability')
      }
    } catch (error) {
      console.error('Error adding availability:', error)
      alert('Failed to add availability. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    setActionLoading(true)
    try {
      await fetch('/api/admin/coach-availability', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting availability:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddLesson = async () => {
    if (!lessonCourtId || !lessonStartTime || !lessonType || lessonStudentIds.length === 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: lessonCourtId,
          lessonDate: format(selectedDate, 'yyyy-MM-dd'),
          startTime: lessonStartTime,
          lessonType,
          duration: lessonDuration,
          studentIds: lessonStudentIds,
          notes: lessonNotes || null,
        }),
      })

      if (res.ok) {
        setLessonDialogOpen(false)
        setLessonCourtId(null)
        setLessonStartTime('')
        setLessonType('')
        setLessonDuration(1.5)
        setLessonStudentIds([])
        setLessonNotes('')
        fetchLessonsForDate()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create lesson')
      }
    } catch (error) {
      console.error('Error adding lesson:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to cancel this lesson?')) return

    setActionLoading(true)
    try {
      await fetch('/api/admin/lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      fetchLessonsForDate()
    } catch (error) {
      console.error('Error cancelling lesson:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkCompleted = async (lessonId: string) => {
    setActionLoading(true)
    try {
      await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, status: 'completed' }),
      })
      if (activeTab === 'schedule') {
        fetchLessonsForDate()
      } else {
        fetchBillingData()
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate billing per member for the selected month
  const getBillingByMember = () => {
    const billing: Record<string, { member: Member; lessons: LessonSession[]; total: number }> = {}

    lessons
      .filter(l => l.status === 'completed')
      .forEach(lesson => {
        const pricePerStudent = lesson.price / lesson.students.length
        lesson.students.forEach(student => {
          if (!billing[student.id]) {
            billing[student.id] = { member: student, lessons: [], total: 0 }
          }
          billing[student.id].lessons.push(lesson)
          billing[student.id].total += pricePerStudent
        })
      })

    return Object.values(billing).sort((a, b) => b.total - a.total)
  }

  const getLessonTypeInfo = (type: string): LessonTypeConfig | undefined => getLessonType(type)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tAdmin('back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('description')}</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {tAdmin('refresh')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'outline'}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {t('tabs.schedule')}
        </Button>
        <Button
          variant={activeTab === 'availability' ? 'default' : 'outline'}
          onClick={() => setActiveTab('availability')}
        >
          <Clock className="w-4 h-4 mr-2" />
          {t('tabs.availability')}
        </Button>
        <Button
          variant={activeTab === 'billing' ? 'default' : 'outline'}
          onClick={() => setActiveTab('billing')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {t('tabs.billing')}
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'default' : 'outline'}
          onClick={() => setActiveTab('requests')}
          className="relative"
        >
          <Users className="w-4 h-4 mr-2" />
          {t('tabs.requests')}
          {lessonRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {lessonRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Top Section: Date Selection and View Toggle */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Date Selection Card */}
                <Card className="lg:w-80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      {t('scheduled.selectDate')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="flex-1">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        <Badge variant="outline" className="ml-2">
                          {lessons.filter(l => l.status !== 'cancelled').length} {t('scheduled.lessons')}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center border rounded-lg p-1">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-8"
                          >
                            <LayoutGrid className="w-4 h-4 mr-1" />
                            Grid
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8"
                          >
                            <List className="w-4 h-4 mr-1" />
                            List
                          </Button>
                        </div>
                        <Button
                          onClick={() => {
                            setLessonCourtId(null)
                            setLessonStartTime('')
                            setLessonDialogOpen(true)
                          }}
                          disabled={members.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('scheduled.addLesson')}
                        </Button>
                      </div>
                    </div>
                    {members.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        {t('scheduled.addMembersFirst')}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </div>

              {/* Grid/List View */}
              <Card>
                <CardContent className="pt-6">
                  {viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left text-sm font-medium text-gray-700 border-b">
                              Time
                            </th>
                            {courts.map((court) => (
                              <th
                                key={court.id}
                                className="p-2 text-center text-sm font-medium text-gray-700 border-b min-w-[150px]"
                              >
                                {court.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {TIME_SLOTS.map((slot, idx) => {
                            // Check if this slot has any lesson starting here (to show the full lesson card)
                            const lessonStartsHere = lessons.filter(
                              l => l.status !== 'cancelled' && l.startTime === slot.slotTime
                            )

                            return (
                              <tr key={slot.slotTime} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="p-2 text-sm font-medium text-gray-700 border-b whitespace-nowrap">
                                  {formatTimeRange(slot.displayName)}
                                </td>
                                {courts.map((court) => {
                                  const key = `${court.id}-${slot.slotTime}`
                                  const lesson = lessonMap[key]
                                  const isLessonStart = lesson && lesson.startTime === slot.slotTime

                                  if (lesson) {
                                    // Only render the lesson card on the first slot
                                    if (isLessonStart) {
                                      const typeInfo = getLessonTypeInfo(lesson.lessonType)
                                      const slotsCount = Math.round(lesson.duration * 2)
                                      return (
                                        <td
                                          key={court.id}
                                          className="p-1 border-b"
                                          rowSpan={slotsCount}
                                        >
                                          <div
                                            className={`p-2 rounded text-xs h-full ${
                                              lesson.status === 'completed'
                                                ? 'bg-green-100 border border-green-200'
                                                : 'bg-purple-100 border border-purple-200'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1 font-medium flex-wrap">
                                              <GraduationCap className="w-3 h-3 text-purple-600" />
                                              <span className="text-purple-700">{typeInfo?.label}</span>
                                              {lesson.status === 'completed' && (
                                                <Badge className="text-[10px] px-1 py-0 bg-green-200 text-green-700 border-0">
                                                  Done
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-gray-600 mt-1">
                                              <Users className="w-3 h-3 inline mr-1" />
                                              {lesson.students.map(s => s.name).join(', ')}
                                            </div>
                                            <div className="text-gray-600 mt-1">
                                              <Clock className="w-3 h-3 inline mr-1" />
                                              {lesson.duration}hr • RM{lesson.price}
                                            </div>
                                            {lesson.status === 'scheduled' && (
                                              <div className="flex gap-1 mt-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 text-green-600 hover:text-green-700 hover:bg-green-50 flex-1"
                                                  onClick={() => handleMarkCompleted(lesson.id)}
                                                  disabled={actionLoading}
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Done
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={() => handleCancelLesson(lesson.id)}
                                                  disabled={actionLoading}
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      )
                                    }
                                    // Skip cells that are part of a multi-slot lesson
                                    return null
                                  } else {
                                    // Check if slot has a booking
                                    const bookingKey = `${court.id}-${slot.slotTime}`
                                    const booking = bookingMap[bookingKey]

                                    if (booking) {
                                      // Show booked slot
                                      return (
                                        <td key={court.id} className="p-1 border-b">
                                          <div className="w-full h-10 flex items-center justify-center bg-gray-100 border border-gray-200 rounded text-xs text-gray-500">
                                            {booking.isRecurring ? (
                                              <span title={booking.recurringLabel || 'Recurring booking'}>
                                                {booking.recurringLabel || 'Recurring'}
                                              </span>
                                            ) : (
                                              <span title={booking.guestName || booking.userName || 'Booked'}>
                                                Booked
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      )
                                    }

                                    // Empty slot - show add button
                                    return (
                                      <td key={court.id} className="p-1 border-b">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full h-10 border-dashed text-gray-400 hover:text-gray-600"
                                          onClick={() => openAddLessonDialog(court.id, slot.slotTime)}
                                          disabled={members.length === 0}
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      </td>
                                    )
                                  }
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* List View */
                    <>
                      {lessons.filter(l => l.status !== 'cancelled').length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          No lessons scheduled for this date
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {lessons
                            .filter(l => l.status !== 'cancelled')
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((lesson) => {
                              const typeInfo = getLessonTypeInfo(lesson.lessonType)
                              return (
                                <div
                                  key={lesson.id}
                                  className={`p-4 rounded-lg border ${
                                    lesson.status === 'completed'
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-purple-50 border-purple-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{typeInfo?.label}</span>
                                        <Badge variant="outline">{lesson.court.name}</Badge>
                                        {lesson.status === 'completed' && (
                                          <Badge className="bg-green-600">Completed</Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {lesson.startTime} - {lesson.endTime} ({lesson.duration}hr)
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        <Users className="w-3 h-3 inline mr-1" />
                                        {lesson.students.map(s => s.name).join(', ')}
                                      </div>
                                      <div className="text-sm font-medium mt-1">
                                        RM{lesson.price} ({lesson.students.length > 1
                                          ? `RM${(lesson.price / lesson.students.length).toFixed(0)} each`
                                          : 'total'})
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {lesson.status === 'scheduled' && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600"
                                            onClick={() => handleMarkCompleted(lesson.id)}
                                            disabled={actionLoading}
                                          >
                                            <Check className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => handleCancelLesson(lesson.id)}
                                            disabled={actionLoading}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Coach Availability</CardTitle>
                  <Button onClick={() => setAvailabilityDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Availability
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coachAvailability.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No availability set. Add your available times for training.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coachAvailability.map((avail) => (
                      <div
                        key={avail.id}
                        className="p-4 rounded-lg border bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{DAYS_OF_WEEK[avail.dayOfWeek]}</div>
                            <div className="text-sm text-gray-600">
                              {avail.startTime} - {avail.endTime}
                            </div>
                            {avail.isRecurring && (
                              <Badge variant="outline" className="mt-1">Weekly</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDeleteAvailability(avail.id)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Monthly Billing Summary</CardTitle>
                    <Input
                      type="month"
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {getBillingByMember().length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No completed lessons for this month
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getBillingByMember().map(({ member, lessons: memberLessons, total }) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-lg border bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-lg">{member.name}</span>
                                <Badge variant="outline">{member.phone}</Badge>
                              </div>
                              <div className="mt-2 space-y-1">
                                {memberLessons.map((lesson) => {
                                  const typeInfo = getLessonTypeInfo(lesson.lessonType)
                                  const pricePerStudent = lesson.price / lesson.students.length
                                  return (
                                    <div key={lesson.id} className="text-sm text-gray-600 flex justify-between">
                                      <span>
                                        {format(new Date(lesson.lessonDate), 'MMM d')} - {typeInfo?.label} ({lesson.duration}hr)
                                      </span>
                                      <span>RM{pricePerStudent.toFixed(0)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                RM{total.toFixed(0)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {memberLessons.length} lesson{memberLessons.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Total Revenue</span>
                          <span className="text-2xl font-bold">
                            RM{getBillingByMember().reduce((sum, b) => sum + b.total, 0).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <Card>
              <CardHeader>
                <CardTitle>Member Lesson Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {lessonRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No lesson requests yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Requests */}
                    {lessonRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Pending Requests</h3>
                        <div className="space-y-3">
                          {lessonRequests.filter(r => r.status === 'pending').map((request) => {
                            const typeInfo = getLessonTypeInfo(request.lessonType)
                            return (
                              <div key={request.id} className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{request.member.name}</span>
                                      <Badge variant="outline">{request.member.phone}</Badge>
                                      {request.member.skillLevel && (
                                        <Badge className="bg-purple-100 text-purple-700 border-0">
                                          {request.member.skillLevel}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <strong>Requested:</strong> {format(new Date(request.requestedDate), 'EEEE, MMMM d, yyyy')} at {request.requestedTime}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <strong>Type:</strong> {typeInfo?.label} ({request.requestedDuration}hr) - <strong className="text-green-600">RM{getLessonPrice(request.lessonType, request.requestedDuration)}</strong>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Requested on {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => openApproveDialog(request)}
                                      disabled={actionLoading}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => {
                                        const notes = prompt('Reason for rejection (optional):')
                                        handleRequestAction(request.id, 'rejected', notes || undefined)
                                      }}
                                      disabled={actionLoading}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const suggestedTime = prompt('Suggest a different time (e.g., 10:00):')
                                        if (suggestedTime) {
                                          const notes = prompt('Add a note for the member:')
                                          handleRequestAction(request.id, 'changed', notes || undefined, suggestedTime)
                                        }
                                      }}
                                      disabled={actionLoading}
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      Suggest Time
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Processed Requests */}
                    {lessonRequests.filter(r => r.status !== 'pending').length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 mt-6">Processed Requests</h3>
                        <div className="space-y-3">
                          {lessonRequests.filter(r => r.status !== 'pending').slice(0, 10).map((request) => {
                            const typeInfo = getLessonTypeInfo(request.lessonType)
                            return (
                              <div key={request.id} className={`p-4 rounded-lg border ${
                                request.status === 'approved' ? 'bg-green-50 border-green-200' :
                                request.status === 'rejected' ? 'bg-red-50 border-red-200' :
                                'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{request.member.name}</span>
                                      <Badge className={
                                        request.status === 'approved' ? 'bg-green-600' :
                                        request.status === 'rejected' ? 'bg-red-600' :
                                        'bg-blue-600'
                                      }>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {format(new Date(request.requestedDate), 'MMM d, yyyy')} at {request.requestedTime} - {typeInfo?.label} ({request.requestedDuration}hr) - RM{getLessonPrice(request.lessonType, request.requestedDuration)}
                                    </div>
                                    {request.adminNotes && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        Note: {request.adminNotes}
                                      </div>
                                    )}
                                    {request.suggestedTime && (
                                      <div className="text-sm text-blue-600 mt-1">
                                        Suggested time: {request.suggestedTime}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Coach Availability</DialogTitle>
            <DialogDescription>
              Set when you are available for training sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Days of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={availDays.includes(idx) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (availDays.includes(idx)) {
                        setAvailDays(availDays.filter(d => d !== idx))
                      } else {
                        setAvailDays([...availDays, idx])
                      }
                    }}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Select value={availStartTime} onValueChange={setAvailStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start" />
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
              <div>
                <Label>End Time</Label>
                <Select value={availEndTime} onValueChange={setAvailEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select end" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.filter(s => s.slotTime > availStartTime).map((slot) => (
                      <SelectItem key={slot.slotTime} value={slot.slotTime}>
                        {slot.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailabilityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAvailability}
              disabled={actionLoading || availDays.length === 0 || !availStartTime || !availEndTime}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Availability'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Lesson</DialogTitle>
            <DialogDescription>
              Schedule a lesson for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lesson Type</Label>
                <Select
                  value={lessonType}
                  onValueChange={(v) => {
                    setLessonType(v)
                    // Auto-select default duration for this type
                    setLessonDuration(getDefaultDuration(v))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.label}</span>
                          {type.billingType === 'monthly' ? (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              RM{type.pricing as number}/mo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              From RM{Object.values(type.pricing as Record<number, number>)[0]}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lessonType && isMonthlyBilling(lessonType) && (
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Monthly billing - 4 sessions/month
                  </p>
                )}
              </div>
              <div>
                <Label>Duration</Label>
                {lessonType && isMonthlyBilling(lessonType) ? (
                  <div className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                    Duration is set by monthly schedule
                  </div>
                ) : (
                  <Select
                    value={lessonDuration.toString()}
                    onValueChange={(v) => setLessonDuration(parseFloat(v))}
                    disabled={!lessonType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonType && getDurationOptions(lessonType).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label} - RM{opt.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Price Display */}
            {lessonType && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">
                      {isMonthlyBilling(lessonType) ? 'Monthly Price' : 'Session Price'}
                    </span>
                    <p className="font-bold text-xl text-blue-700">
                      RM{getLessonPrice(lessonType, lessonDuration)}
                      {isMonthlyBilling(lessonType) && <span className="text-sm font-normal">/month</span>}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Max {getLessonType(lessonType)?.maxStudents} student(s)</p>
                    {!isMonthlyBilling(lessonType) && <p>{lessonDuration} hours</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Court</Label>
                <Select
                  value={lessonCourtId?.toString() || ''}
                  onValueChange={(v) => setLessonCourtId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id.toString()}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time</Label>
                <Select value={lessonStartTime} onValueChange={setLessonStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
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
            </div>

            <div>
              <Label>Students</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {members.map((member) => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      lessonStudentIds.includes(member.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={lessonStudentIds.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLessonStudentIds([...lessonStudentIds, member.id])
                        } else {
                          setLessonStudentIds(lessonStudentIds.filter(id => id !== member.id))
                        }
                      }}
                      className="rounded"
                    />
                    <span>{member.name}</span>
                    {member.skillLevel && (
                      <Badge variant="outline" className="text-xs">{member.skillLevel}</Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={lessonNotes}
                onChange={(e) => setLessonNotes(e.target.value)}
                placeholder="Any notes about this session"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLesson}
              disabled={
                actionLoading ||
                !lessonCourtId ||
                !lessonStartTime ||
                !lessonType ||
                lessonStudentIds.length === 0
              }
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Schedule Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog - Select Court */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Lesson Request</DialogTitle>
            <DialogDescription>
              Select an available court for this lesson
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4 space-y-4">
              {/* Request Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{selectedRequest.member.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.lessonType.replace('-', ' ')} lesson ({selectedRequest.requestedDuration}hr)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{format(new Date(selectedRequest.requestedDate), 'EEE, MMM d')}</p>
                    <p className="text-lg font-bold text-blue-600">{selectedRequest.requestedTime}</p>
                    <p className="text-sm font-medium text-green-600">RM{getLessonPrice(selectedRequest.lessonType, selectedRequest.requestedDuration)}</p>
                  </div>
                </div>
              </div>

              {/* Court Selection Grid */}
              <div>
                <Label className="mb-3 block">Select Court</Label>
                {loadingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {courts.map((court) => {
                      const isAvailable = courtAvailability[court.id] !== false
                      const isSelected = approveCourtId === court.id
                      return (
                        <button
                          key={court.id}
                          onClick={() => isAvailable && setApproveCourtId(court.id)}
                          disabled={!isAvailable}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            !isAvailable
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-green-100 border-green-500 ring-2 ring-green-500'
                              : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          <p className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                            {court.name}
                          </p>
                          <p className={`text-sm mt-1 ${
                            !isAvailable
                              ? 'text-red-500'
                              : isSelected
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }`}>
                            {!isAvailable ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                          </p>
                          {isSelected && (
                            <div className="mt-2">
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Time slot info */}
              {approveCourtId && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>{courts.find(c => c.id === approveCourtId)?.name}</strong> will be booked for{' '}
                    <strong>{selectedRequest.member.name}</strong> on{' '}
                    <strong>{format(new Date(selectedRequest.requestedDate), 'MMM d')}</strong> at{' '}
                    <strong>{selectedRequest.requestedTime}</strong> ({selectedRequest.requestedDuration}hr) - <strong>RM{getLessonPrice(selectedRequest.lessonType, selectedRequest.requestedDuration)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithCourt}
              disabled={actionLoading || !approveCourtId}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
