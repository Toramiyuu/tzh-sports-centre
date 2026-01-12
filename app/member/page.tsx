'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GraduationCap,
  Calendar,
  Clock,
  Loader2,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { format, addDays, isBefore, startOfDay } from 'date-fns'

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
  requestedDuration: number // in hours
  status: string
  adminNotes: string | null
  suggestedTime: string | null
  createdAt: string
}

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

// Lesson pricing: base price for minimum duration, RM50 per additional 30 min
const LESSON_TYPES = [
  { value: '1-to-1', label: '1-to-1 Private', basePrice: 130, minSlots: 3, ratePerSlot: 50 }, // 1.5hr min
  { value: '1-to-2', label: '1-to-2', basePrice: 160, minSlots: 3, ratePerSlot: 50 }, // 1.5hr min
  { value: '1-to-3', label: '1-to-3', basePrice: 180, minSlots: 4, ratePerSlot: 50 }, // 2hr min
  { value: '1-to-4', label: '1-to-4', basePrice: 200, minSlots: 4, ratePerSlot: 50 }, // 2hr min
]

// Calculate price for a lesson based on type and number of 30-min slots
function calculateLessonPrice(lessonType: string, slots: number): number {
  const type = LESSON_TYPES.find(t => t.value === lessonType)
  if (!type) return 0

  if (slots <= type.minSlots) {
    return type.basePrice
  }

  // Base price + additional slots at rate
  const additionalSlots = slots - type.minSlots
  return Math.round(type.basePrice + (additionalSlots * type.ratePerSlot))
}

// Get minimum duration in hours for a lesson type
function getMinDuration(lessonType: string): number {
  const type = LESSON_TYPES.find(t => t.value === lessonType)
  return type ? type.minSlots * 0.5 : 1.5
}

// Get minimum slots for a lesson type
function getMinSlots(lessonType: string): number {
  const type = LESSON_TYPES.find(t => t.value === lessonType)
  return type ? type.minSlots : 3
}

// Get available duration options for a lesson type (30-min increments up to 4 hours)
function getDurationOptions(lessonType: string): { slots: number; label: string; price: number }[] {
  const minSlots = getMinSlots(lessonType)
  const maxSlots = 8 // 4 hours max
  const options: { slots: number; label: string; price: number }[] = []

  for (let slots = minSlots; slots <= maxSlots; slots++) {
    const hours = slots * 0.5
    const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`
    options.push({
      slots,
      label: hourLabel,
      price: calculateLessonPrice(lessonType, slots),
    })
  }

  return options
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Training time slots (9 AM to 12 AM in 30-minute increments)
function getTrainingSlots() {
  const slots: string[] = []
  for (let hour = 9; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  slots.push('00:00')
  return slots
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export default function MemberDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [requests, setRequests] = useState<LessonRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Request form state
  const [requestDate, setRequestDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [requestType, setRequestType] = useState('')
  const [requestDuration, setRequestDuration] = useState(3) // Number of 30-min slots (default 1.5hr = 3 slots)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

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

  const fetchAvailability = async (date: string) => {
    setLoadingAvailability(true)
    try {
      const res = await fetch(`/api/member/availability?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleDateChange = (date: string) => {
    setRequestDate(date)
    setRequestTime('')
    if (date) {
      fetchAvailability(date)
    } else {
      setAvailability([])
    }
  }

  const getAvailableTimesForDate = () => {
    if (!requestDate || availability.length === 0) return []

    const times: string[] = []
    const allSlots = getTrainingSlots()

    availability.forEach(slot => {
      const startIndex = allSlots.indexOf(slot.startTime)
      const endIndex = allSlots.indexOf(slot.endTime)

      if (startIndex !== -1 && endIndex !== -1) {
        for (let i = startIndex; i < endIndex; i++) {
          if (!times.includes(allSlots[i])) {
            times.push(allSlots[i])
          }
        }
      }
    })

    return times.sort()
  }

  const handleTypeChange = (value: string) => {
    setRequestType(value)
    // Reset duration to minimum for the new type
    const minSlots = getMinSlots(value)
    setRequestDuration(minSlots)
  }

  const submitRequest = async () => {
    if (!requestDate || !requestTime || !requestType) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/member/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDate: requestDate,
          requestedTime: requestTime,
          lessonType: requestType,
          requestedDuration: requestDuration * 0.5, // Convert slots to hours
        }),
      })

      if (res.ok) {
        setShowRequestDialog(false)
        setRequestDate('')
        setRequestTime('')
        setRequestType('')
        setRequestDuration(3)
        setAvailability([])
        fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const res = await fetch('/api/member/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (res.ok) {
        fetchRequests()
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
        fetchRequests()
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

  const counterProposeTime = async (requestId: string) => {
    const newTime = prompt('Enter your preferred time (e.g., 10:00 or 14:30):')
    if (!newTime) return

    // Basic validation
    if (!/^\d{1,2}:\d{2}$/.test(newTime)) {
      alert('Please enter time in format HH:MM (e.g., 10:00 or 14:30)')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/member/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'counter', newTime }),
      })

      if (res.ok) {
        fetchRequests()
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      case 'changed':
        return <Badge className="bg-blue-100 text-blue-700 border-0"><ArrowRight className="w-3 h-3 mr-1" />Time Changed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLessonStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-0">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Filter lessons into upcoming and past
  const today = startOfDay(new Date())
  const upcomingLessons = lessons.filter(l => !isBefore(new Date(l.lessonDate), today) && l.status === 'scheduled')
  const pastLessons = lessons.filter(l => isBefore(new Date(l.lessonDate), today) || l.status !== 'scheduled')
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const suggestedRequests = requests.filter(r => r.status === 'changed')

  // Min date for request (tomorrow)
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (isMember === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Members Only</h2>
            <p className="text-gray-600 mb-4">
              This area is for training members only. If you&apos;re interested in joining our training program, please contact us.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Member Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
          </div>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request Lesson
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcomingLessons.length}</p>
                <p className="text-sm text-gray-500">Upcoming Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                <p className="text-sm text-gray-500">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pastLessons.filter(l => l.status === 'completed').length}</p>
                <p className="text-sm text-gray-500">Completed Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Needing Response (Coach Suggested Different Time) */}
      {suggestedRequests.length > 0 && (
        <Card className="mb-6 border-blue-300">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              Coach Suggested New Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {suggestedRequests.map((request) => (
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
                        {request.lessonType.replace('-', ' ')} lesson ({request.requestedDuration}hr)
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      RM{calculateLessonPrice(request.lessonType, request.requestedDuration * 2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500">Your requested time</p>
                      <p className="font-medium text-gray-400 line-through">{formatTime(request.requestedTime)}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <p className="text-xs text-green-600">Coach suggests</p>
                      <p className="font-medium text-green-700">{request.suggestedTime ? formatTime(request.suggestedTime) : 'N/A'}</p>
                    </div>
                  </div>

                  {request.adminNotes && (
                    <p className="text-sm text-gray-600 mb-3 italic">
                      Coach&apos;s note: {request.adminNotes}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => acceptSuggestedTime(request.id)}
                      disabled={submitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accept Time
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => counterProposeTime(request.id)}
                      disabled={submitting}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Suggest Different Time
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(request.requestedDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatTime(request.requestedTime)} - {request.lessonType.replace('-', ' ')} lesson ({request.requestedDuration}hr)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      RM{calculateLessonPrice(request.lessonType, request.requestedDuration * 2)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => cancelRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Lessons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Lessons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No upcoming lessons scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(lesson.lessonDate), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)} ({lesson.duration}h)
                      </p>
                      <p className="text-sm text-gray-600">
                        {lesson.court.name} - {lesson.lessonType.replace('-', ' ')} lesson
                      </p>
                      {lesson.students.length > 1 && (
                        <p className="text-sm text-gray-500 mt-1">
                          With: {lesson.students.filter(s => s.name !== session?.user?.name).map(s => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {getLessonStatusBadge(lesson.status)}
                      <p className="text-sm font-medium text-gray-900 mt-2">RM{lesson.price}</p>
                    </div>
                  </div>
                  {lesson.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">Note: {lesson.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request History</CardTitle>
          <CardDescription>Your past lesson requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.filter(r => r.status !== 'pending').length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No request history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.filter(r => r.status !== 'pending').map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(request.requestedDate), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(request.requestedTime)} - {request.lessonType.replace('-', ' ')} lesson
                      </p>
                      {request.adminNotes && (
                        <p className="text-sm text-gray-500 mt-1">Coach: {request.adminNotes}</p>
                      )}
                      {request.suggestedTime && (
                        <p className="text-sm text-blue-600 mt-1">Suggested: {formatTime(request.suggestedTime)}</p>
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

      {/* Request Lesson Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request a Lesson</DialogTitle>
            <DialogDescription>
              Choose your preferred date and time. The coach will review and confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={minDate}
              />
            </div>

            {requestDate && (
              <>
                {loadingAvailability ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : availability.length === 0 ? (
                  <p className="text-sm text-yellow-600 py-2">
                    No availability set for {DAY_NAMES[new Date(requestDate).getDay()]}. You can still request this time.
                  </p>
                ) : (
                  <p className="text-sm text-green-600 py-2">
                    Coach is available on {DAY_NAMES[new Date(requestDate).getDay()]}.
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Select value={requestTime} onValueChange={setRequestTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTrainingSlots().map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {formatTime(slot)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lesson Type</Label>
                  <Select value={requestType} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (min {type.minSlots * 0.5}hr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requestType && (
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={requestDuration.toString()}
                      onValueChange={(v) => setRequestDuration(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDurationOptions(requestType).map((opt) => (
                          <SelectItem key={opt.slots} value={opt.slots.toString()}>
                            {opt.label} - RM{opt.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Summary */}
                {requestType && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {LESSON_TYPES.find(t => t.value === requestType)?.label} - {requestDuration * 0.5} hours
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        RM{calculateLessonPrice(requestType, requestDuration)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitRequest}
              disabled={!requestDate || !requestTime || !requestType || submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
