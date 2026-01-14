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
  Pencil,
  Search,
  X,
  CreditCard,
  Banknote,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'

// Format time slot to show 30-min range (e.g., "9:00 AM" -> "9:00 - 9:30 AM")
const formatTimeRange = (displayName: string): string => {
  const match = displayName.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return displayName

  let hour = parseInt(match[1])
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
  paymentStatus?: string
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
  paymentStatus: string
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
  userId: string | null
  user: { id: string; uid: string; name: string; phone: string } | null
  isActive: boolean
  court: Court
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('admin.bookings')
  const tAdmin = useTranslations('admin')
  const tDays = useTranslations('days')

  const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

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
  const [recurringUserUid, setRecurringUserUid] = useState('')
  const [recurringUser, setRecurringUser] = useState<{ id: string; uid: string; name: string; phone: string } | null>(null)
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  // For non-registered users
  const [recurringGuestName, setRecurringGuestName] = useState('')
  const [recurringGuestPhone, setRecurringGuestPhone] = useState('')
  const [guestPhoneError, setGuestPhoneError] = useState('')

  // Multi-select for bulk delete
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<Set<string>>(new Set())
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Toggle selection for recurring booking
  const toggleRecurringSelection = (id: string) => {
    setSelectedRecurringIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Toggle selection for regular booking
  const toggleBookingSelection = (id: string) => {
    setSelectedBookingIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedRecurringIds(new Set())
    setSelectedBookingIds(new Set())
    setSelectionMode(false)
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setActionLoading(true)
    try {
      // Delete selected recurring bookings
      if (selectedRecurringIds.size > 0) {
        await fetch('/api/recurring-bookings', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedRecurringIds) }),
        })
      }

      // Delete selected regular bookings
      if (selectedBookingIds.size > 0) {
        await fetch('/api/admin/bookings', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: Array.from(selectedBookingIds) }),
        })
      }

      // Refresh and clear
      fetchBookings()
      fetchRecurringBookings()
      clearSelections()
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Error deleting bookings:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Phone validation for Malaysian numbers
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Empty is valid (optional field)
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // Malaysian mobile: 01xxxxxxxx (10-11 digits starting with 01)
    // Also allow numbers starting with 60 (country code) or +60
    // Minimum 10 digits, maximum 12 digits
    if (cleaned.length < 10 || cleaned.length > 12) return false
    // Must start with 01 or 60
    return cleaned.startsWith('01') || cleaned.startsWith('60')
  }

  // Edit recurring booking
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringBooking | null>(null)

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

    // Validate guest phone if provided
    if (recurringGuestPhone && !validatePhone(recurringGuestPhone)) {
      setGuestPhoneError(t('invalidPhone'))
      return
    }
    setGuestPhoneError('')

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
          userId: recurringUser?.id || null,
          // For non-registered users
          guestName: recurringGuestName || null,
          guestPhone: recurringGuestPhone || null,
        }),
      })

      if (res.ok) {
        setRecurringDialogOpen(false)
        resetRecurringForm()
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

  // Search user by UID
  const searchUserByUid = async () => {
    if (!recurringUserUid) return
    setUserSearchLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts?uid=${recurringUserUid}`)
      const data = await res.json()
      if (res.ok && data.user) {
        setRecurringUser(data.user)
      } else {
        setRecurringUser(null)
        alert('User not found')
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setRecurringUser(null)
    } finally {
      setUserSearchLoading(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (rb: RecurringBooking) => {
    // Close the recurring bookings dialog first
    setRecurringDialogOpen(false)

    setEditingRecurring(rb)
    setRecurringCourtIds([rb.courtId])
    setRecurringDays([rb.dayOfWeek])
    setRecurringStartTime(rb.startTime)
    setRecurringEndTime(rb.endTime)
    setRecurringSport(rb.sport as 'badminton' | 'pickleball')
    setRecurringLabel(rb.label || '')
    setRecurringEndDate(rb.endDate ? rb.endDate.split('T')[0] : '')
    setRecurringUser(rb.user)
    setRecurringUserUid(rb.user?.uid || '')
    setRecurringGuestName(rb.guestName || '')
    setRecurringGuestPhone(rb.guestPhone || '')
    setEditDialogOpen(true)
  }

  // Open edit dialog by recurring booking ID (for grid cells)
  const openEditDialogById = (recurringId: string) => {
    const rb = recurringBookings.find(r => r.id === recurringId)
    if (rb) {
      openEditDialog(rb)
    }
  }

  // Update recurring booking
  const handleUpdateRecurring = async () => {
    if (!editingRecurring) return

    // Validate guest phone if provided
    if (recurringGuestPhone && !validatePhone(recurringGuestPhone)) {
      setGuestPhoneError(t('invalidPhone'))
      return
    }
    setGuestPhoneError('')

    setActionLoading(true)
    try {
      const res = await fetch('/api/recurring-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecurring.id,
          courtId: recurringCourtIds[0],
          sport: recurringSport,
          dayOfWeek: recurringDays[0],
          startTime: recurringStartTime,
          endTime: recurringEndTime,
          endDate: recurringEndDate || null,
          label: recurringLabel,
          userId: recurringUser?.id || null,
          guestName: recurringGuestName || null,
          guestPhone: recurringGuestPhone || null,
        }),
      })

      if (res.ok) {
        setEditDialogOpen(false)
        setEditingRecurring(null)
        resetRecurringForm()
        fetchRecurringBookings()
        fetchBookings()
      }
    } catch (error) {
      console.error('Error updating recurring booking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Reset recurring form
  const resetRecurringForm = () => {
    setRecurringCourtIds([])
    setRecurringDays([])
    setRecurringStartTime('')
    setRecurringEndTime('')
    setRecurringSport('badminton')
    setRecurringLabel('')
    setRecurringEndDate('')
    setRecurringUserUid('')
    setRecurringUser(null)
    setRecurringGuestName('')
    setRecurringGuestPhone('')
    setGuestPhoneError('')
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

  // Count recurring bookings that fall on the selected day
  const recurringBookingsForDay = recurringBookings.filter((rb) => {
    // Check if the day of week matches
    if (rb.dayOfWeek !== selectedDate.getDay()) return false

    // Check if the booking is active
    if (!rb.isActive) return false

    // Check if selected date is within the date range
    const rbStartDate = startOfDay(new Date(rb.startDate))
    const rbEndDate = rb.endDate ? startOfDay(new Date(rb.endDate)) : null
    const selectedDateStart = startOfDay(selectedDate)

    if (selectedDateStart < rbStartDate) return false
    if (rbEndDate && selectedDateStart > rbEndDate) return false

    // Apply sport filter
    if (sportFilter !== 'all' && rb.sport !== sportFilter) return false

    return true
  })

  // Total bookings for the day (regular + recurring)
  const totalBookingsForDay = filteredBookings.length + recurringBookingsForDay.length

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
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => setRecurringDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-sm"
          >
            <Repeat className="w-4 h-4 mr-2" />
            {t('recurringBookings')}
            {recurringBookings.length > 0 && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-0">{recurringBookings.length}</Badge>
            )}
          </Button>
          <Button onClick={fetchBookings} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {tAdmin('refresh')}
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
                {t('selectDate')}
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
                  {t('grid')}
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <List className="w-4 h-4 mr-1" />
                  {t('list')}
                </Button>
              </div>

              {/* Sport Filter */}
              <div className="mt-4">
                <Label className="text-xs text-gray-500">{t('filterBySport')}</Label>
                <div className="flex gap-1 mt-1">
                  {(['all', 'badminton', 'pickleball'] as Sport[]).map((s) => (
                    <Button
                      key={s}
                      variant={sportFilter === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSportFilter(s)}
                      className="flex-1 text-xs px-2"
                    >
                      {s === 'all' ? t('all') : s === 'badminton' ? t('badminton') : t('pickleball')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selection Mode Toggle */}
              <div className="mt-4">
                <Button
                  variant={selectionMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectionMode) {
                      clearSelections()
                    } else {
                      setSelectionMode(true)
                    }
                  }}
                  className={`w-full ${selectionMode ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {selectionMode ? (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      {t('exitSelectMode')}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      {t('selectMode')}
                    </>
                  )}
                </Button>
              </div>

              {/* Operating Hours */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{t('operatingHours')}</p>
                      <p className="text-gray-500">{t('weekdays')}</p>
                      <p className="text-gray-500">{t('weekends')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{t('contact')}</p>
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
                  {totalBookingsForDay} {totalBookingsForDay !== 1 ? t('bookings') : t('booking')}
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
                          {t('time')}
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
                              const isSelected = booking.isRecurring
                                ? selectedRecurringIds.has(booking.id)
                                : selectedBookingIds.has(booking.id)

                              return (
                                <td key={court.id} className="p-2 border-b">
                                  <div
                                    className={`p-2 rounded text-xs relative ${
                                      isSelected
                                        ? 'ring-2 ring-red-500 bg-red-50'
                                        : booking.isRecurring
                                        ? 'bg-purple-100 border border-purple-200'
                                        : booking.sport === 'badminton'
                                        ? 'bg-blue-100 border border-blue-200'
                                        : 'bg-green-100 border border-green-200'
                                    } ${selectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                                    onClick={selectionMode ? () => {
                                      if (booking.isRecurring) {
                                        toggleRecurringSelection(booking.id)
                                      } else {
                                        toggleBookingSelection(booking.id)
                                      }
                                    } : undefined}
                                  >
                                    {/* Selection checkbox indicator */}
                                    {selectionMode && (
                                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                        isSelected ? 'bg-red-500' : 'bg-gray-300'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                    )}
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
                                          {t('recurring')}
                                        </Badge>
                                      )}
                                      {booking.isGuest && !booking.isRecurring && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          {t('guest')}
                                        </Badge>
                                      )}
                                    </div>
                                    {booking.phone && (
                                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                                        <Phone className="w-3 h-3" />
                                        {booking.phone}
                                      </div>
                                    )}
                                    {!booking.isRecurring && booking.paymentStatus && (
                                      <div className="mt-1">
                                        {booking.paymentStatus === 'paid' ? (
                                          <Badge className="text-[10px] px-1 py-0 bg-green-100 text-green-700 border-0">
                                            <CreditCard className="w-2.5 h-2.5 mr-0.5" />
                                            Paid
                                          </Badge>
                                        ) : (
                                          <Badge className="text-[10px] px-1 py-0 bg-yellow-100 text-yellow-700 border-0">
                                            <Banknote className="w-2.5 h-2.5 mr-0.5" />
                                            Pending
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    {!selectionMode && booking.isRecurring && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-1 h-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                        onClick={() => openEditDialogById(booking.id)}
                                      >
                                        <Pencil className="w-3 h-3 mr-1" />
                                        {t('edit')}
                                      </Button>
                                    )}
                                    {!selectionMode && !booking.isRecurring && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-1 h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => openCancelDialog(booking)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        {t('cancel')}
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
                                    {t('filtered')}
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
                  {totalBookingsForDay === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      {t('noBookings')}
                    </div>
                  ) : (
                    <>
                    {/* Show recurring bookings for the day first */}
                    {recurringBookingsForDay.map((rb) => (
                      <div
                        key={`recurring-${rb.id}`}
                        className="p-4 rounded-lg border bg-purple-50 border-purple-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Repeat className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-900">
                                {rb.label || (rb.user?.name || rb.guestName || 'Unknown')}
                              </span>
                              <Badge className="bg-purple-100 text-purple-700 border-0">
                                {t('recurring')}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  rb.sport === 'badminton'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }
                              >
                                {rb.sport}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {rb.user?.name || rb.guestName || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {rb.user?.phone || rb.guestPhone || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {rb.court.name} | {rb.startTime} - {rb.endTime}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                            onClick={() => openEditDialog(rb)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            {t('edit')}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Then show regular bookings */}
                    {filteredBookings.map((booking) => (
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
                                  {t('guest')}
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
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium">
                                RM{booking.totalAmount.toFixed(2)}
                              </span>
                              {booking.paymentStatus === 'paid' ? (
                                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                                  <Banknote className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
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
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    ))}
                    </>
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
            <DialogTitle>{relatedBookings.length > 1 ? t('cancelBookings') : t('cancelBooking')}</DialogTitle>
            <DialogDescription>
              {relatedBookings.length > 1
                ? t('consecutivePickleball', { count: relatedBookings.length })
                : t('confirmCancel')}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="py-4">
              <p>
                <strong>{t('name')}:</strong> {selectedBooking.name}
              </p>
              <p>
                <strong>{t('phone')}:</strong> {selectedBooking.phone}
              </p>
              <p>
                <strong>{t('sport')}:</strong> {selectedBooking.sport}
              </p>
              {relatedBookings.length > 1 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    {t('slotsToBeCancelled')}
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
              {relatedBookings.length > 1 ? t('keepBookings') : t('keepBooking')}
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
              {relatedBookings.length > 1 ? t('cancelBookings') : t('cancelBooking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booking Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addBookingTitle')}</DialogTitle>
            <DialogDescription>
              {t('addBookingDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t('name')} *</Label>
              <Input
                value={newBookingName}
                onChange={(e) => setNewBookingName(e.target.value)}
                placeholder={t('customerName')}
              />
            </div>
            <div>
              <Label>{t('phone')} *</Label>
              <Input
                value={newBookingPhone}
                onChange={(e) => setNewBookingPhone(e.target.value)}
                placeholder="012-345-6789"
              />
            </div>
            <div>
              <Label>{t('sport')}</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={newBookingSport === 'badminton' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewBookingSport('badminton')}
                >
                  {t('badmintonPrice')}
                </Button>
                <Button
                  variant={newBookingSport === 'pickleball' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewBookingSport('pickleball')}
                >
                  {t('pickleballPrice')}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t('cancel')}
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
              {t('addBooking')}
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
              {t('recurringTitle')}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('recurringDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Existing Recurring Bookings List */}
            {recurringBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">{t('activeBookings')}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {recurringBookings.length} {t('active')}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {recurringBookings.map((rb) => (
                    <div
                      key={rb.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                        rb.sport === 'badminton'
                          ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                          : 'bg-green-50/50 border-green-200 hover:bg-green-50'
                      }`}
                      onClick={() => openEditDialog(rb)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${
                          rb.sport === 'badminton' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{rb.label || rb.sport}</span>
                            {rb.user && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                                #{rb.user.uid}
                              </Badge>
                            )}
                            {!rb.user && rb.guestName && (
                              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                                {t('guest')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{DAYS_OF_WEEK[rb.dayOfWeek]}</span>
                            <span className="text-gray-300">|</span>
                            <span>{rb.court.name}</span>
                            <span className="text-gray-300">|</span>
                            <span>{rb.startTime} - {rb.endTime}</span>
                            {rb.user && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-purple-600">{rb.user.name}</span>
                              </>
                            )}
                            {!rb.user && rb.guestName && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-orange-600">{rb.guestName}</span>
                                {rb.guestPhone && (
                                  <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-orange-500">{rb.guestPhone}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditDialog(rb)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteRecurring(rb.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Recurring Booking Form */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                {t('addNewRecurring')}
              </h4>

              <div className="space-y-5">
                {/* Label and Sport Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('bookingName')}</Label>
                    <Input
                      value={recurringLabel}
                      onChange={(e) => setRecurringLabel(e.target.value)}
                      placeholder={t('bookingNamePlaceholder')}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('sportType')}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={recurringSport === 'badminton' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${recurringSport === 'badminton' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white'}`}
                        onClick={() => setRecurringSport('badminton')}
                      >
                        {t('badminton')}
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
                        {t('pickleball')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Days Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium text-gray-700">{t('daysOfWeek')}</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([1, 2, 3, 4, 5])}
                      >
                        {t('weekdaysBtn')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([0, 6])}
                      >
                        {t('weekendsBtn')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringDays([0, 1, 2, 3, 4, 5, 6])}
                      >
                        {t('allBtn')}
                      </Button>
                      {recurringDays.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setRecurringDays([])}
                        >
                          {t('clear')}
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
                    <Label className="text-xs font-medium text-gray-700">{t('courts')}</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setRecurringCourtIds(courts.map(c => c.id))}
                      >
                        {t('selectAll')}
                      </Button>
                      {recurringCourtIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => setRecurringCourtIds([])}
                        >
                          {t('clear')}
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
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('startTime')}</Label>
                    <Select value={recurringStartTime} onValueChange={(val) => {
                      setRecurringStartTime(val)
                      if (recurringEndTime && recurringEndTime <= val) {
                        setRecurringEndTime('')
                      }
                    }}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectStart')} />
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
                      {t('endTime')} {recurringSport === 'pickleball' && <span className="text-green-600 font-normal">({t('minHours')})</span>}
                    </Label>
                    <Select value={recurringEndTime} onValueChange={setRecurringEndTime} disabled={!recurringStartTime}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={t('selectEnd')} />
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
                            return <SelectItem value="24:00">{t('midnight')}</SelectItem>
                          }
                          return null
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('endDate')} <span className="text-gray-400 font-normal">({t('optional')})</span></Label>
                    <Input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Link to User by UID (optional) */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    {t('linkToUser')} <span className="text-gray-400 font-normal">({t('optional')})</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={recurringUserUid}
                      onChange={(e) => setRecurringUserUid(e.target.value)}
                      placeholder={t('enterUid')}
                      className="bg-white flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchUserByUid}
                      disabled={userSearchLoading || !recurringUserUid}
                      className="px-4"
                    >
                      {userSearchLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                    {recurringUser && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRecurringUser(null)
                          setRecurringUserUid('')
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {recurringUser && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">{recurringUser.name}</span>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          #{recurringUser.uid}
                        </Badge>
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {recurringUser.phone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Guest Info (for non-registered users) */}
                {!recurringUser && (
                  <div className="border-t border-gray-200 pt-4">
                    <Label className="text-xs font-medium text-gray-700 mb-3 block">
                      {t('orEnterGuest')}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('guestName')}</Label>
                        <Input
                          value={recurringGuestName}
                          onChange={(e) => setRecurringGuestName(e.target.value)}
                          placeholder={t('guestNamePlaceholder')}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('guestPhone')}</Label>
                        <Input
                          value={recurringGuestPhone}
                          onChange={(e) => {
                            setRecurringGuestPhone(e.target.value)
                            if (guestPhoneError) setGuestPhoneError('')
                          }}
                          placeholder={t('guestPhonePlaceholder')}
                          className={`bg-white ${guestPhoneError ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {guestPhoneError && (
                          <p className="text-xs text-red-500 mt-1">{guestPhoneError}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{t('phoneFormat')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {recurringDays.length > 0 && recurringCourtIds.length > 0 && recurringStartTime && recurringEndTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 text-sm">
                          {recurringDays.length * recurringCourtIds.length > 1
                            ? t('readyToCreatePlural', { count: recurringDays.length * recurringCourtIds.length })
                            : t('readyToCreate', { count: recurringDays.length * recurringCourtIds.length })}
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          {recurringDays.sort((a, b) => a - b).map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ')}
                          {' '}&bull;{' '}
                          {recurringCourtIds.length} {t('courts').toLowerCase()}
                          {' '}&bull;{' '}
                          {timeSlots.find(s => s.slotTime === recurringStartTime)?.displayName} - {
                            recurringEndTime === '24:00' ? t('midnight') : timeSlots.find(s => s.slotTime === recurringEndTime)?.displayName
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
              {t('cancel')}
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
              {t('createRecurring')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Recurring Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditDialogOpen(false)
          setEditingRecurring(null)
          resetRecurringForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Pencil className="w-5 h-5 text-orange-600" />
              </div>
              {t('editRecurring')}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {t('editRecurringDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Label and Sport Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('bookingName')}</Label>
                <Input
                  value={recurringLabel}
                  onChange={(e) => setRecurringLabel(e.target.value)}
                  placeholder={t('bookingNamePlaceholder')}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('sportType')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={recurringSport === 'badminton' ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${recurringSport === 'badminton' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setRecurringSport('badminton')}
                  >
                    {t('badminton')}
                  </Button>
                  <Button
                    type="button"
                    variant={recurringSport === 'pickleball' ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${recurringSport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => setRecurringSport('pickleball')}
                  >
                    {t('pickleball')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Day Selection (single day for edit) */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-2 block">{t('dayOfWeek')}</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRecurringDays([idx])}
                    className={`py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                      recurringDays.includes(idx)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Court Selection (single court for edit) */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-2 block">{t('court')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setRecurringCourtIds([court.id])}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      recurringCourtIds.includes(court.id)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {court.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('startTime')}</Label>
                <Select value={recurringStartTime} onValueChange={(val) => {
                  setRecurringStartTime(val)
                  if (recurringEndTime && recurringEndTime <= val) {
                    setRecurringEndTime('')
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectStart')} />
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
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('endTime')}</Label>
                <Select value={recurringEndTime} onValueChange={setRecurringEndTime} disabled={!recurringStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectEnd')} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter((slot) => {
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
                    {(() => {
                      const startIndex = timeSlots.findIndex(s => s.slotTime === recurringStartTime)
                      const minHours = recurringSport === 'pickleball' ? 2 : 1
                      if (startIndex >= 0 && (timeSlots.length + 1) - startIndex > minHours) {
                        return <SelectItem value="24:00">{t('midnight')}</SelectItem>
                      }
                      return null
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('endDate')} <span className="text-gray-400 font-normal">({t('optional')})</span></Label>
                <Input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Link to User by UID */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                {t('linkToUser')} <span className="text-gray-400 font-normal">({t('optional')})</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={recurringUserUid}
                  onChange={(e) => setRecurringUserUid(e.target.value)}
                  placeholder={t('enterUid')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={searchUserByUid}
                  disabled={userSearchLoading || !recurringUserUid}
                  className="px-4"
                >
                  {userSearchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
                {recurringUser && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRecurringUser(null)
                      setRecurringUserUid('')
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {recurringUser && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">{recurringUser.name}</span>
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                      #{recurringUser.uid}
                    </Badge>
                  </div>
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {recurringUser.phone}
                  </div>
                </div>
              )}
            </div>

            {/* Guest Info (for non-registered users) */}
            {!recurringUser && (
              <div className="border-t border-gray-200 pt-4">
                <Label className="text-xs font-medium text-gray-700 mb-3 block">
                  {t('orEnterGuest')}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('guestName')}</Label>
                    <Input
                      value={recurringGuestName}
                      onChange={(e) => setRecurringGuestName(e.target.value)}
                      placeholder={t('guestNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">{t('guestPhone')}</Label>
                    <Input
                      value={recurringGuestPhone}
                      onChange={(e) => {
                        setRecurringGuestPhone(e.target.value)
                        if (guestPhoneError) setGuestPhoneError('')
                      }}
                      placeholder={t('guestPhonePlaceholder')}
                      className={guestPhoneError ? 'border-red-500 focus:ring-red-500' : ''}
                    />
                    {guestPhoneError && (
                      <p className="text-xs text-red-500 mt-1">{guestPhoneError}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{t('phoneFormat')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false)
              setEditingRecurring(null)
              resetRecurringForm()
            }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpdateRecurring}
              className="bg-orange-600 hover:bg-orange-700 shadow-sm"
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
                <Check className="w-4 h-4 mr-2" />
              )}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Bar for Selection Mode */}
      {selectionMode && (selectedRecurringIds.size > 0 || selectedBookingIds.size > 0) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">
            {selectedRecurringIds.size + selectedBookingIds.size} {t('selected')}
            {selectedRecurringIds.size > 0 && (
              <span className="text-purple-300 ml-1">({selectedRecurringIds.size} {t('recurring')})</span>
            )}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t('deleteSelected')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelections}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('confirmDeleteTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('confirmDeleteDescription', {
                count: selectedRecurringIds.size + selectedBookingIds.size
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedRecurringIds.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-2 rounded mb-2">
                <Repeat className="w-4 h-4" />
                {selectedRecurringIds.size} {t('recurringBookings')}
              </div>
            )}
            {selectedBookingIds.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                <CalendarDays className="w-4 h-4" />
                {selectedBookingIds.size} {t('regularBookings')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {tAdmin('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('deleteAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
