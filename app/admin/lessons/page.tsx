'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
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
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LESSON_TYPES = [
  { value: '1-to-1', label: '1-to-1 Private', price: 130, duration: 1.5, students: 1 },
  { value: '1-to-2', label: '1-to-2', price: 160, duration: 1.5, students: 2 },
  { value: '1-to-3', label: '1-to-3', price: 180, duration: 2, students: 3 },
  { value: '1-to-4', label: '1-to-4', price: 200, duration: 2, students: 4 },
]

// Generate time slots from 9 AM to 11 PM in 30-min increments
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minutes = i % 2 === 0 ? '00' : '30'
  const slotTime = `${hour.toString().padStart(2, '0')}:${minutes}`
  const ampm = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour <= 12 ? hour : hour - 12
  return { slotTime, displayName: `${displayHour}:${minutes} ${ampm}` }
})

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

export default function AdminLessonsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability' | 'billing' | 'requests'>('schedule')

  // Data states
  const [coachAvailability, setCoachAvailability] = useState<CoachAvailability[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [lessons, setLessons] = useState<LessonSession[]>([])
  const [lessonRequests, setLessonRequests] = useState<LessonRequest[]>([])

  // Calendar & Filter states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [billingMonth, setBillingMonth] = useState(format(new Date(), 'yyyy-MM'))

  // Dialog states
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)

  // Form states for availability
  const [availDays, setAvailDays] = useState<number[]>([])
  const [availStartTime, setAvailStartTime] = useState('')
  const [availEndTime, setAvailEndTime] = useState('')

  // Form states for lesson
  const [lessonCourtId, setLessonCourtId] = useState<number | null>(null)
  const [lessonStartTime, setLessonStartTime] = useState('')
  const [lessonType, setLessonType] = useState('')
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

  const handleRequestAction = async (requestId: string, status: string, adminNotes?: string, suggestedTime?: string) => {
    setActionLoading(true)
    try {
      await fetch('/api/admin/lesson-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, adminNotes, suggestedTime }),
      })
      fetchRequests()
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const fetchLessonsForDate = async () => {
    try {
      const res = await fetch(`/api/admin/lessons?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      const data = await res.json()
      setLessons(data.lessons || [])
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
          studentIds: lessonStudentIds,
          notes: lessonNotes || null,
        }),
      })

      if (res.ok) {
        setLessonDialogOpen(false)
        setLessonCourtId(null)
        setLessonStartTime('')
        setLessonType('')
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

  const getLessonTypeInfo = (type: string) => LESSON_TYPES.find(t => t.value === type)

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
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lesson Management</h1>
            <p className="text-gray-600">Schedule lessons and manage billing</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'outline'}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Schedule
        </Button>
        <Button
          variant={activeTab === 'availability' ? 'default' : 'outline'}
          onClick={() => setActiveTab('availability')}
        >
          <Clock className="w-4 h-4 mr-2" />
          Availability
        </Button>
        <Button
          variant={activeTab === 'billing' ? 'default' : 'outline'}
          onClick={() => setActiveTab('billing')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Monthly Billing
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'default' : 'outline'}
          onClick={() => setActiveTab('requests')}
          className="relative"
        >
          <Users className="w-4 h-4 mr-2" />
          Requests
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
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />
                    <Button
                      className="w-full mt-4"
                      onClick={() => setLessonDialogOpen(true)}
                      disabled={members.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lesson
                    </Button>
                    {members.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Add members first to schedule lessons
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Lessons for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                                    : 'bg-blue-50 border-blue-200'
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
                  </CardContent>
                </Card>
              </div>
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
                                      <strong>Type:</strong> {typeInfo?.label} ({typeInfo?.duration}hr) - RM{typeInfo?.price}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Requested on {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleRequestAction(request.id, 'approved')}
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
                                      {format(new Date(request.requestedDate), 'MMM d, yyyy')} at {request.requestedTime} - {typeInfo?.label}
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
            <div>
              <Label>Lesson Type</Label>
              <Select value={lessonType} onValueChange={setLessonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} - RM{type.price} ({type.duration}hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
    </div>
  )
}
