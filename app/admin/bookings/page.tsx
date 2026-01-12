'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  CalendarDays,
  Clock,
  Loader2,
  Phone,
  User,
  Trash2,
  Plus,
  List,
  Grid3X3,
  RefreshCw,
  Repeat,
  Check,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'

// Format time slot to show range
const formatTimeRange = (displayName: string): string => {
  const match = displayName.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return displayName

  let hour = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()

  let endHour = hour + 1
  let endPeriod = period

  if (hour === 11 && period === 'AM') {
    endPeriod = 'PM'
  } else if (hour === 11 && period === 'PM') {
    endPeriod = 'AM'
  } else if (hour === 12) {
    endHour = 1
  }

  return `${hour}:${minutes} - ${endHour}:${minutes} ${endPeriod}`
}

interface Court {
  id: number
  name: string
}

interface TimeSlot {
  id: number
  slotTime: string
  displayName: string
}

interface BookingInfo {
  id: string
  name: string
  phone: string
  email: string | null
  sport: string
  status: string
  isGuest: boolean
  isRecurring?: boolean
  recurringLabel?: string
}

interface FullBooking {
  id: string
  courtId: number
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  court: Court
  user: {
    name: string | null
    phone: string | null
    email: string | null
  } | null
}

type ViewMode = 'grid' | 'list'
type Sport = 'all' | 'badminton' | 'pickleball'

interface RecurringBooking {
  id: string
  courtId: number
  sport: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startDate: string
  endDate: string | null
  label: string | null
  guestName: string | null
  guestPhone: string | null
  isActive: boolean
  court: Court
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [courts, setCourts] = useState<Court[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookingMap, setBookingMap] = useState<Record<string, BookingInfo>>({})
  const [bookings, setBookings] = useState<FullBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sportFilter, setSportFilter] = useState<Sport>('all')

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingInfo | null>(null)
  const [relatedBookings, setRelatedBookings] = useState<FullBooking[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: number; slotTime: string } | null>(null)

  // Add booking form
  const [newBookingName, setNewBookingName] = useState('')
  const [newBookingPhone, setNewBookingPhone] = useState('')
  const [newBookingSport, setNewBookingSport] = useState<'badminton' | 'pickleball'>('badminton')
  const [actionLoading, setActionLoading] = useState(false)

  // Recurring bookings
  const [recurringBookings, setRecurringBookings] = useState<RecurringBooking[]>([])
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [recurringCourtIds, setRecurringCourtIds] = useState<number[]>([])
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringStartTime, setRecurringStartTime] = useState<string>('')
  const [recurringEndTime, setRecurringEndTime] = useState<string>('')
  const [recurringSport, setRecurringSport] = useState<'badminton' | 'pickleball'>('badminton')
  const [recurringLabel, setRecurringLabel] = useState('')
  const [recurringEndDate, setRecurringEndDate] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email)) {
      router.push('/')
    }
  }, [session, status, router])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/bookings?date=${format(selectedDate, 'yyyy-MM-dd')}`
      )
      const data = await res.json()

      if (res.ok) {
        setCourts(data.courts || [])
        setTimeSlots(data.timeSlots || [])
        setBookingMap(data.bookingMap || {})
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecurringBookings = async () => {
    try {
      const res = await fetch('/api/recurring-bookings')
      const data = await res.json()
      if (res.ok) {
        setRecurringBookings(data.recurringBookings || [])
      }
    } catch (error) {
      console.error('Error fetching recurring bookings:', error)
    }
  }

  const handleAddRecurring = async () => {
    if (recurringCourtIds.length === 0 || recurringDays.length === 0 || !recurringStartTime || !recurringEndTime || !recurringLabel) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/recurring-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtIds: recurringCourtIds,
          sport: recurringSport,
          daysOfWeek: recurringDays,
          startTime: recurringStartTime,
          endTime: recurringEndTime,
          startDate: new Date().toISOString(),
          endDate: recurringEndDate || null,
          label: recurringLabel,
          isAdminBooking: true,
        }),
      })

      if (res.ok) {
        setRecurringDialogOpen(false)
        setRecurringCourtIds([])
        setRecurringDays([])
        setRecurringStartTime('')
        setRecurringEndTime('')
        setRecurringSport('badminton')
        setRecurringLabel('')
        setRecurringEndDate('')
        fetchRecurringBookings()
        fetchBookings()
      }
    } catch (error) {
      console.error('Error adding recurring booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/recurring-bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        fetchRecurringBookings()
        fetchBookings()
      }
    } catch (error) {
      console.error('Error deleting recurring booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && isAdmin(session.user.email)) {
      fetchBookings()
      fetchRecurringBookings()
    }
  }, [selectedDate, session])

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    setActionLoading(true)
    try {
      // Cancel all related bookings (for pickleball consecutive hours)
      const bookingIds = relatedBookings.length > 0
        ? relatedBookings.map(b => b.id)
        : [selectedBooking.id]

      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds }),
      })

      if (res.ok) {
        setCancelDialogOpen(false)
        setSelectedBooking(null)
        setRelatedBookings([])
        fetchBookings()
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddBooking = async () => {
    if (!selectedSlot || !newBookingName || !newBookingPhone) return

    setActionLoading(true)
    try {
      // Calculate end time (1 hour later)
      const slot = timeSlots.find((s) => s.slotTime === selectedSlot.slotTime)
      const slotIndex = timeSlots.findIndex((s) => s.slotTime === selectedSlot.slotTime)
      const endSlot = timeSlots[slotIndex + 1]

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: selectedSlot.courtId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedSlot.slotTime,
          endTime: endSlot?.slotTime || selectedSlot.slotTime,
          sport: newBookingSport,
          guestName: newBookingName,
          guestPhone: newBookingPhone,
        }),
      })

      if (res.ok) {
        setAddDialogOpen(false)
        setSelectedSlot(null)
        setNewBookingName('')
        setNewBookingPhone('')
        fetchBookings()
      }
    } catch (error) {
      console.error('Error adding booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Find all consecutive bookings by the same person on the same court (for pickleball)
  const findRelatedBookings = (bookingId: string): FullBooking[] => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking || booking.sport !== 'pickleball') return []

    // Find all pickleball bookings by the same person on the same court
    const customerIdentifier = booking.guestPhone || booking.user?.phone || booking.guestName || booking.user?.name
    const related = bookings.filter(b => {
      if (b.sport !== 'pickleball' || b.courtId !== booking.courtId) return false
      const bIdentifier = b.guestPhone || b.user?.phone || b.guestName || b.user?.name
      return bIdentifier === customerIdentifier
    })

    // Sort by start time
    related.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return related
  }

  const openCancelDialog = (booking: BookingInfo) => {
    setSelectedBooking(booking)
    // For pickleball, find all consecutive bookings
    if (booking.sport === 'pickleball') {
      const related = findRelatedBookings(booking.id)
      setRelatedBookings(related)
    } else {
      setRelatedBookings([])
    }
    setCancelDialogOpen(true)
  }

  const openAddDialog = (courtId: number, slotTime: string) => {
    setSelectedSlot({ courtId, slotTime })
    setAddDialogOpen(true)
  }

  const filteredBookings = bookings.filter((b) => {
    if (sportFilter === 'all') return true
    return b.sport === sportFilter
  })

  if (status === 'loading' || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600">View and manage all court bookings</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => setRecurringDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-sm"
          >
            <Repeat className="w-4 h-4 mr-2" />
            Recurring Bookings
            {recurringBookings.length > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0">{recurringBookings.length}</Badge>
            )}
          </Button>
          <Button onClick={fetchBookings} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Select Date
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

          {/* View Mode Toggle */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex-1"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
              </div>

              {/* Sport Filter */}
              <div className="mt-4">
                <Label className="text-xs text-gray-500">Filter by Sport</Label>
                <div className="flex gap-1 mt-1">
                  {(['all', 'badminton', 'pickleball'] as Sport[]).map((s) => (
                    <Button
                      key={s}
                      variant={sportFilter === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSportFilter(s)}
                      className="flex-1 text-xs px-2"
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Operating Hours */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Operating Hours</p>
                      <p className="text-gray-500">Weekdays: 3 PM - 12 AM</p>
                      <p className="text-gray-500">Weekends: 9 AM - 12 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Contact</p>
                      <p className="text-gray-500">011-6868 8508</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right: Bookings View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                <Badge variant="outline" className="ml-2">
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : viewMode === 'grid' ? (
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
                      {timeSlots.map((slot, idx) => (
                        <tr key={slot.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="p-2 text-sm font-medium text-gray-700 border-b whitespace-nowrap">
                            {formatTimeRange(slot.displayName)}
                          </td>
                          {courts.map((court) => {
                            const key = `${court.id}-${slot.slotTime}`
                            const booking = bookingMap[key]
                            const matchesFilter =
                              sportFilter === 'all' || booking?.sport === sportFilter

                            if (booking && matchesFilter) {
                              return (
                                <td key={court.id} className="p-2 border-b">
                                  <div
                                    className={`p-2 rounded text-xs ${
                                      booking.isRecurring
                                        ? 'bg-purple-100 border border-purple-200'
                                        : booking.sport === 'badminton'
                                        ? 'bg-blue-100 border border-blue-200'
                                        : 'bg-green-100 border border-green-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 font-medium flex-wrap">
                                      {booking.isRecurring ? (
                                        <Repeat className="w-3 h-3 text-purple-600" />
                                      ) : (
                                        <User className="w-3 h-3" />
                                      )}
                                      <span className={booking.isRecurring ? 'text-purple-700' : ''}>
                                        {booking.name}
                                      </span>
                                      {booking.isRecurring && (
                                        <Badge className="text-[10px] px-1 py-0 bg-purple-200 text-purple-700 border-0">
                                          Recurring
                                        </Badge>
                                      )}
                                      {booking.isGuest && !booking.isRecurring && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          Guest
                                        </Badge>
                                      )}
                                    </div>
                                    {booking.phone && (
                                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                                        <Phone className="w-3 h-3" />
                                        {booking.phone}
                                      </div>
                                    )}
                                    {!booking.isRecurring && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-1 h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => openCancelDialog(booking)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              )
                            } else if (!booking) {
                              return (
                                <td key={court.id} className="p-2 border-b">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-16 border-dashed text-gray-400 hover:text-gray-600"
                                    onClick={() => openAddDialog(court.id, slot.slotTime)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </td>
                              )
                            } else {
                              return (
                                <td key={court.id} className="p-2 border-b">
                                  <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                    Filtered
                                  </div>
                                </td>
                              )
                            }
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {filteredBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No bookings for this date
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-4 rounded-lg border ${
                          booking.sport === 'badminton'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {booking.guestName || booking.user?.name || 'Unknown'}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  booking.sport === 'badminton'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }
                              >
                                {booking.sport}
                              </Badge>
                              {!booking.user && (
                                <Badge variant="outline" className="text-xs">
                                  Guest
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.guestPhone || booking.user?.phone || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.court.name} | {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            <div className="text-sm font-medium mt-1">
                              RM{booking.totalAmount.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              openCancelDialog({
                                id: booking.id,
                                name: booking.guestName || booking.user?.name || 'Unknown',
                                phone: booking.guestPhone || booking.user?.phone || '',
                                email: booking.guestEmail || booking.user?.email || null,
                                sport: booking.sport,
                                status: booking.status,
                                isGuest: !booking.user,
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking{relatedBookings.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              {relatedBookings.length > 1
                ? `This will cancel all ${relatedBookings.length} consecutive pickleball bookings for this customer.`
                : 'Are you sure you want to cancel this booking?'}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <p>
                <strong>Name:</strong> {selectedBooking.name}
              </p>
              <p>
                <strong>Phone:</strong> {selectedBooking.phone}
              </p>
              <p>
                <strong>Sport:</strong> {selectedBooking.sport}
              </p>
              {relatedBookings.length > 1 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Slots to be cancelled:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {relatedBookings.map((b) => (
                      <li key={b.id}>
                        {b.court.name} | {b.startTime} - {b.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking{relatedBookings.length > 1 ? 's' : ''}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Cancel {relatedBookings.length > 1 ? `${relatedBookings.length} Bookings` : 'Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booking Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
            <DialogDescription>
              Manually add a booking for this time slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newBookingName}
                onChange={(e) => setNewBookingName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={newBookingPhone}
                onChange={(e) => setNewBookingPhone(e.target.value)}
                placeholder="012-345-6789"
              />
            </div>
            <div>
              <Label>Sport</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={newBookingSport === 'badminton' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewBookingSport('badminton')}
                >
                  Badminton (RM15)
                </Button>
                <Button
                  variant={newBookingSport === 'pickleball' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewBookingSport('pickleball')}
                >
                  Pickleball (RM25)
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBooking}
              disabled={actionLoading || !newBookingName || !newBookingPhone}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Booking Dialog */}
      <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Repeat className="w-5 h-5 text-blue-600" />
              </div>
              Recurring Bookings
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Set up weekly recurring bookings for training sessions and social games
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Existing Recurring Bookings List */}
            {recurringBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Active Bookings</h4>
                  <Badge variant="secondary" className="text-xs">
                    {recurringBookings.length} active
                  </Badge>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {recurringBookings.map((rb) => (
                    <div
                      key={rb.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${
                        rb.sport === 'badminton'
                          ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                          : 'bg-green-50/50 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${
                          rb.sport === 'badminton' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">{rb.label || rb.sport}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{DAYS_OF_WEEK[rb.dayOfWeek]}</span>
                            <span className="text-gray-300">|</span>
                            <span>{rb.court.name}</span>
                            <span className="text-gray-300">|</span>
                            <span>{rb.startTime} - {rb.endTime}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteRecurring(rb.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Recurring Booking Form */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Add New Recurring Booking
              </h4>

              <div className="space-y-5">
                {/* Label and Sport Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Booking Name</Label>
                    <Input
                      value={recurringLabel}
                      onChange={(e) => setRecurringLabel(e.target.value)}
                      placeholder="e.g., Social Games, Training"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Sport Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={recurringSport === 'badminton' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${recurringSport === 'badminton' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white'}`}
                        onClick={() => setRecurringSport('badminton')}
                      >
                        Badminton
                      </Button>
                      <Button
                        type="button"
                        variant={recurringSport === 'pickleball' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${recurringSport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : 'bg-white'}`}
                        onClick={() => {
                          setRecurringSport('pickleball')
                          // Clear end time if it doesn't meet 2-hour minimum for pickleball
                          if (recurringStartTime && recurringEndTime) {
                            const startIndex = timeSlots.findIndex(s => s.slotTime === recurringStartTime)
                            const endIndex = recurringEndTime === '22:00'
                              ? timeSlots.length
                              : timeSlots.findIndex(s => s.slotTime === recurringEndTime)
                            if (endIndex - startIndex < 2) {
                              setRecurringEndTime('')
                            }
                          }
                        }}
                      >
                        Pickleball
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Days Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-gray-700">Days of Week</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([1, 2, 3, 4, 5])}
                      >
                        Weekdays
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([0, 6])}
                      >
                        Weekends
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([0, 1, 2, 3, 4, 5, 6])}
                      >
                        All
                      </Button>
                      {recurringDays.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setRecurringDays([])}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (recurringDays.includes(idx)) {
                            setRecurringDays(recurringDays.filter(d => d !== idx))
                          } else {
                            setRecurringDays([...recurringDays, idx])
                          }
                        }}
                        className={`py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                          recurringDays.includes(idx)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courts Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-gray-700">Courts</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringCourtIds(courts.map(c => c.id))}
                      >
                        Select All
                      </Button>
                      {recurringCourtIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setRecurringCourtIds([])}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {courts.map((court) => (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          if (recurringCourtIds.includes(court.id)) {
                            setRecurringCourtIds(recurringCourtIds.filter(id => id !== court.id))
                          } else {
                            setRecurringCourtIds([...recurringCourtIds, court.id])
                          }
                        }}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                          recurringCourtIds.includes(court.id)
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {court.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Start Time</Label>
                    <Select value={recurringStartTime} onValueChange={(val) => {
                      setRecurringStartTime(val)
                      if (recurringEndTime && recurringEndTime <= val) {
                        setRecurringEndTime('')
                      }
                    }}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select start" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.slotTime}>
                            {slot.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      End Time {recurringSport === 'pickleball' && <span className="text-green-600 font-normal">(2hr min)</span>}
                    </Label>
                    <Select value={recurringEndTime} onValueChange={setRecurringEndTime} disabled={!recurringStartTime}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select end" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots
                          .filter((slot) => {
                            // For pickleball, require at least 2 hours
                            const minHours = recurringSport === 'pickleball' ? 2 : 1
                            const startIndex = timeSlots.findIndex(s => s.slotTime === recurringStartTime)
                            const currentIndex = timeSlots.findIndex(s => s.slotTime === slot.slotTime)
                            return currentIndex >= startIndex + minHours
                          })
                          .map((slot) => (
                            <SelectItem key={slot.id} value={slot.slotTime}>
                              {slot.displayName}
                            </SelectItem>
                          ))}
                        {/* Add midnight (closing time) as end option if it meets minimum hours */}
                        {(() => {
                          const startIndex = timeSlots.findIndex(s => s.slotTime === recurringStartTime)
                          const minHours = recurringSport === 'pickleball' ? 2 : 1
                          // Midnight is after the last slot, so check if we have enough hours
                          // timeSlots.length gives us the count, and midnight would be 1 hour after the last slot
                          if (startIndex >= 0 && (timeSlots.length + 1) - startIndex > minHours) {
                            return <SelectItem value="24:00">12:00 AM (Midnight)</SelectItem>
                          }
                          return null
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">End Date <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Summary */}
                {recurringDays.length > 0 && recurringCourtIds.length > 0 && recurringStartTime && recurringEndTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 text-sm">
                          Ready to create {recurringDays.length * recurringCourtIds.length} recurring slot{recurringDays.length * recurringCourtIds.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          {recurringDays.sort((a, b) => a - b).map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ')}
                          {' '}&bull;{' '}
                          {recurringCourtIds.length} court{recurringCourtIds.length > 1 ? 's' : ''}
                          {' '}&bull;{' '}
                          {timeSlots.find(s => s.slotTime === recurringStartTime)?.displayName} - {
                            recurringEndTime === '24:00' ? '12:00 AM (Midnight)' : timeSlots.find(s => s.slotTime === recurringEndTime)?.displayName
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setRecurringDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRecurring}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              disabled={
                actionLoading ||
                recurringCourtIds.length === 0 ||
                recurringDays.length === 0 ||
                !recurringStartTime ||
                !recurringEndTime ||
                !recurringLabel
              }
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Recurring Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
