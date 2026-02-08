'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format, startOfDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
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
  XCircle,
  ZoomIn,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'

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
  paymentUserConfirmed?: boolean
  paymentMethod?: string
  paymentScreenshotUrl?: string | null
  receiptVerificationStatus?: string | null
  verificationNotes?: string | null
  totalAmount?: number
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
  paymentUserConfirmed?: boolean
  paymentMethod?: string
  paymentScreenshotUrl?: string | null
  receiptVerificationStatus?: string | null
  verificationNotes?: string | null
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

export default function BookingsContent() {
  const { data: session, status } = useSession()
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

  // Payment confirmation
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [bookingToConfirmPayment, setBookingToConfirmPayment] = useState<BookingInfo | null>(null)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [imageZoomOpen, setImageZoomOpen] = useState(false)
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null)

  // Bulk edit for recurring bookings
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditEndDate, setBulkEditEndDate] = useState('')
  const [bulkEditHourlyRate, setBulkEditHourlyRate] = useState('')
  const [bulkEditLabel, setBulkEditLabel] = useState('')
  const [bulkEditUserUid, setBulkEditUserUid] = useState('')
  const [bulkEditUser, setBulkEditUser] = useState<{ id: string; uid: string; name: string; phone: string } | null>(null)
  const [bulkEditGuestName, setBulkEditGuestName] = useState('')
  const [bulkEditGuestPhone, setBulkEditGuestPhone] = useState('')

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

  // Handle payment confirmation (single booking)
  const handleConfirmPayment = async () => {
    if (!bookingToConfirmPayment) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingToConfirmPayment.id,
          action: 'approve',
          notes: verificationNotes || null,
        }),
      })

      if (res.ok) {
        setPaymentConfirmOpen(false)
        setBookingToConfirmPayment(null)
        setVerificationNotes('')
        fetchBookings()
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!bookingToConfirmPayment) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingToConfirmPayment.id,
          action: 'reject',
          notes: verificationNotes || null,
        }),
      })

      if (res.ok) {
        setPaymentConfirmOpen(false)
        setBookingToConfirmPayment(null)
        setVerificationNotes('')
        fetchBookings()
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle bulk payment confirmation
  const handleBulkConfirmPayment = async () => {
    if (selectedBookingIds.size === 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/bookings/confirm-payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selectedBookingIds) }),
      })

      if (res.ok) {
        fetchBookings()
        clearSelections()
      }
    } catch (error) {
      console.error('Error confirming payments:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Get count of selected bookings with pending payment
  const selectedPendingPaymentCount = Array.from(selectedBookingIds).filter(id => {
    const booking = bookings.find(b => b.id === id)
    return booking?.paymentStatus === 'pending'
  }).length

  // Search user by UID for bulk edit
  const searchUserForBulkEdit = async () => {
    if (!bulkEditUserUid) return
    setUserSearchLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts?uid=${bulkEditUserUid}`)
      const data = await res.json()
      if (res.ok && data.user) {
        setBulkEditUser(data.user)
      } else {
        setBulkEditUser(null)
        alert('User not found')
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setBulkEditUser(null)
    } finally {
      setUserSearchLoading(false)
    }
  }

  // Handle bulk edit for recurring bookings
  const handleBulkEditRecurring = async () => {
    if (selectedRecurringIds.size === 0) return

    setActionLoading(true)
    try {
      // Build update data - only include fields that are set
      const updateData: Record<string, unknown> = {}

      if (bulkEditEndDate) {
        updateData.endDate = bulkEditEndDate
      }
      if (bulkEditHourlyRate) {
        updateData.hourlyRate = parseFloat(bulkEditHourlyRate)
      }
      if (bulkEditLabel) {
        updateData.label = bulkEditLabel
      }
      if (bulkEditUser) {
        updateData.userId = bulkEditUser.id
        updateData.guestName = null
        updateData.guestPhone = null
      } else if (bulkEditGuestName || bulkEditGuestPhone) {
        updateData.userId = null
        if (bulkEditGuestName) updateData.guestName = bulkEditGuestName
        if (bulkEditGuestPhone) updateData.guestPhone = bulkEditGuestPhone
      }

      // Update each selected recurring booking
      const updatePromises = Array.from(selectedRecurringIds).map(id =>
        fetch('/api/recurring-bookings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updateData }),
        })
      )

      await Promise.all(updatePromises)

      setBulkEditOpen(false)
      resetBulkEditForm()
      clearSelections()
      fetchRecurringBookings()
    } catch (error) {
      console.error('Error bulk editing recurring bookings:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Reset bulk edit form
  const resetBulkEditForm = () => {
    setBulkEditEndDate('')
    setBulkEditHourlyRate('')
    setBulkEditLabel('')
    setBulkEditUserUid('')
    setBulkEditUser(null)
    setBulkEditGuestName('')
    setBulkEditGuestPhone('')
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

  // Auth is handled by the parent page

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
    if (session?.user && isAdmin(session.user.email, session.user.isAdmin)) {
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/70" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={() => setRecurringDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 h-10 px-4 text-sm"
        >
          <Repeat className="w-4 h-4 mr-2" />
          {t('recurringBookings')}
          {recurringBookings.length > 0 && (
            <Badge className="ml-2 bg-teal-900/30 text-teal-400 border-0">{recurringBookings.length}</Badge>
          )}
        </Button>
        <Button onClick={fetchBookings} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {tAdmin('refresh')}
        </Button>
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
                <Label className="text-xs text-muted-foreground">{t('filterBySport')}</Label>
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
              <div className="mt-4 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="font-medium text-foreground">{t('operatingHours')}</p>
                      <p className="text-muted-foreground">{t('weekdays')}</p>
                      <p className="text-muted-foreground">{t('weekends')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="font-medium text-foreground">{t('contact')}</p>
                      <p className="text-muted-foreground">011-6868 8508</p>
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
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/70" />
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="p-2 text-left text-sm font-medium text-foreground border-b border-border">
                          {t('time')}
                        </th>
                        {courts.map((court) => (
                          <th
                            key={court.id}
                            className="p-2 text-center text-sm font-medium text-foreground border-b border-border min-w-[150px]"
                          >
                            {court.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot, idx) => (
                        <tr key={slot.id} className={idx % 2 === 0 ? 'bg-secondary' : ''}>
                          <td className="p-2 text-sm font-medium text-foreground border-b border-border whitespace-nowrap">
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
                                <td key={court.id} className="p-2 border-b border-border">
                                  <div
                                    className={`p-2 rounded text-xs relative ${
                                      isSelected
                                        ? 'ring-2 ring-red-500 bg-red-900/30'
                                        : booking.isRecurring
                                        ? 'bg-purple-900/50 border border-purple-700'
                                        : booking.receiptVerificationStatus === 'rejected'
                                        ? 'bg-red-900/30 border border-red-700'
                                        : booking.receiptVerificationStatus === 'approved' || booking.paymentStatus === 'paid'
                                        ? 'bg-green-900/50 border border-green-700'
                                        : booking.receiptVerificationStatus === 'pending_verification' || (booking.paymentScreenshotUrl && booking.paymentStatus === 'pending')
                                        ? 'bg-yellow-900/30 border border-yellow-700'
                                        : booking.sport === 'badminton'
                                        ? 'bg-teal-900/30 border border-teal-700'
                                        : 'bg-green-900/50 border border-green-700'
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
                                        isSelected ? 'bg-red-500' : 'bg-[#5a554a]'
                                      }`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 font-medium flex-wrap">
                                      {booking.isRecurring ? (
                                        <Repeat className="w-3 h-3 text-purple-400" />
                                      ) : (
                                        <User className="w-3 h-3 text-foreground" />
                                      )}
                                      <span className={booking.isRecurring ? 'text-purple-400' : 'text-foreground'}>
                                        {booking.name}
                                      </span>
                                      {booking.isRecurring && (
                                        <Badge className="text-[10px] px-1 py-0 bg-purple-900/50 text-purple-400 border-0">
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
                                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                        <Phone className="w-3 h-3" />
                                        {booking.phone}
                                      </div>
                                    )}
                                    {!booking.isRecurring && booking.paymentStatus && (
                                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                                        {booking.receiptVerificationStatus === 'approved' || booking.paymentStatus === 'paid' ? (
                                          <Badge className="text-[10px] px-1 py-0 bg-green-900/50 text-green-400 border-0">
                                            <Check className="w-2.5 h-2.5 mr-0.5" />
                                            Approved
                                          </Badge>
                                        ) : booking.receiptVerificationStatus === 'rejected' ? (
                                          <Badge className="text-[10px] px-1 py-0 bg-red-900/30 text-red-400 border-0">
                                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                                            Rejected
                                          </Badge>
                                        ) : booking.paymentScreenshotUrl ? (
                                          <>
                                            <Badge className="text-[10px] px-1 py-0 bg-yellow-900/30 text-yellow-400 border-0">
                                              <Eye className="w-2.5 h-2.5 mr-0.5" />
                                              Needs Review
                                            </Badge>
                                            {!selectionMode && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-1.5 text-[10px] text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setBookingToConfirmPayment(booking)
                                                  setPaymentConfirmOpen(true)
                                                }}
                                              >
                                                <Eye className="w-2.5 h-2.5 mr-0.5" />
                                                Review
                                              </Button>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <Badge className="text-[10px] px-1 py-0 bg-card text-muted-foreground border-0">
                                              <Banknote className="w-2.5 h-2.5 mr-0.5" />
                                              No Receipt
                                            </Badge>
                                            {!selectionMode && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-1.5 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setBookingToConfirmPayment(booking)
                                                  setPaymentConfirmOpen(true)
                                                }}
                                              >
                                                <Check className="w-2.5 h-2.5 mr-0.5" />
                                                Verify
                                              </Button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                    {!selectionMode && booking.isRecurring && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-1 h-6 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
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
                                        className="w-full mt-1 h-6 text-red-400 hover:text-red-300 hover:bg-red-900/30"
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
                                <td key={court.id} className="p-2 border-b border-border">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-16 border-dashed border-border text-muted-foreground/70 hover:text-muted-foreground hover:bg-card"
                                    onClick={() => openAddDialog(court.id, slot.slotTime)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </td>
                              )
                            } else {
                              return (
                                <td key={court.id} className="p-2 border-b border-border">
                                  <div className="h-16 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground/70">
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
                    <div className="text-center py-12 text-muted-foreground">
                      {t('noBookings')}
                    </div>
                  ) : (
                    <>
                    {/* Show recurring bookings for the day first */}
                    {recurringBookingsForDay.map((rb) => (
                      <div
                        key={`recurring-${rb.id}`}
                        className="p-4 rounded-lg border bg-purple-900/50 border-purple-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Repeat className="w-4 h-4 text-purple-400" />
                              <span className="font-medium text-purple-300">
                                {rb.label || (rb.user?.name || rb.guestName || 'Unknown')}
                              </span>
                              <Badge className="bg-purple-900/50 text-purple-400 border-0">
                                {t('recurring')}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  rb.sport === 'badminton'
                                    ? 'bg-teal-900/30 text-teal-400 border-teal-700'
                                    : 'bg-green-900/50 text-green-400 border-green-700'
                                }
                              >
                                {rb.sport}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {rb.user?.name || rb.guestName || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {rb.user?.phone || rb.guestPhone || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {rb.court.name} | {rb.startTime} - {rb.endTime}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/50"
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
                            ? 'bg-teal-900/30 border-teal-700'
                            : 'bg-green-900/50 border-green-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {booking.guestName || booking.user?.name || 'Unknown'}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  booking.sport === 'badminton'
                                    ? 'bg-teal-900/30 text-teal-400 border-teal-700'
                                    : 'bg-green-900/50 text-green-400 border-green-700'
                                }
                              >
                                {booking.sport}
                              </Badge>
                              {!booking.user && (
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                  {t('guest')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.guestPhone || booking.user?.phone || 'N/A'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.court.name} | {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-foreground">
                                RM{booking.totalAmount.toFixed(2)}
                              </span>
                              {booking.receiptVerificationStatus === 'approved' || booking.paymentStatus === 'paid' ? (
                                <Badge className="bg-green-900/50 text-green-400 border-0 text-xs">
                                  <Check className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : booking.receiptVerificationStatus === 'rejected' ? (
                                <Badge className="bg-red-900/30 text-red-400 border-0 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </Badge>
                              ) : booking.paymentScreenshotUrl ? (
                                <>
                                  <Badge className="bg-yellow-900/30 text-yellow-400 border-0 text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Needs Review
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                                    onClick={() => {
                                      setBookingToConfirmPayment({
                                        id: booking.id,
                                        name: booking.guestName || booking.user?.name || 'Unknown',
                                        phone: booking.guestPhone || booking.user?.phone || '',
                                        email: booking.guestEmail || booking.user?.email || null,
                                        sport: booking.sport,
                                        status: booking.status,
                                        paymentStatus: booking.paymentStatus,
                                        paymentMethod: booking.paymentMethod,
                                        paymentScreenshotUrl: booking.paymentScreenshotUrl,
                                        totalAmount: booking.totalAmount,
                                        isGuest: !booking.user,
                                      })
                                      setPaymentConfirmOpen(true)
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Review
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Badge className="bg-card text-muted-foreground border-0 text-xs">
                                    <Banknote className="w-3 h-3 mr-1" />
                                    No Receipt
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                    onClick={() => {
                                      setBookingToConfirmPayment({
                                        id: booking.id,
                                        name: booking.guestName || booking.user?.name || 'Unknown',
                                        phone: booking.guestPhone || booking.user?.phone || '',
                                        email: booking.guestEmail || booking.user?.email || null,
                                        sport: booking.sport,
                                        status: booking.status,
                                        paymentStatus: booking.paymentStatus,
                                        paymentMethod: booking.paymentMethod,
                                        paymentScreenshotUrl: booking.paymentScreenshotUrl,
                                        totalAmount: booking.totalAmount,
                                        isGuest: !booking.user,
                                      })
                                      setPaymentConfirmOpen(true)
                                    }}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Verify
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
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
                <div className="mt-3 p-3 bg-teal-900/30 border border-teal-700 rounded-lg">
                  <p className="text-sm font-medium text-teal-400 mb-2">
                    {t('slotsToBeCancelled')}
                  </p>
                  <ul className="text-sm text-teal-400 space-y-1">
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
              <PhoneInput
                value={newBookingPhone}
                onChange={setNewBookingPhone}
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
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-teal-900/30 rounded-lg">
                <Repeat className="w-5 h-5 text-teal-400" />
              </div>
              {t('recurringTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('recurringDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Existing Recurring Bookings List */}
            {recurringBookings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">{t('activeBookings')}</h4>
                  <Badge variant="secondary" className="text-xs bg-card text-muted-foreground">
                    {recurringBookings.length} {t('active')}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {recurringBookings.map((rb) => (
                    <div
                      key={rb.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                        rb.sport === 'badminton'
                          ? 'bg-teal-900/20 border-teal-700 hover:bg-teal-900/30'
                          : 'bg-green-900/30 border-green-700 hover:bg-green-900/50'
                      }`}
                      onClick={() => openEditDialog(rb)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${
                          rb.sport === 'badminton' ? 'bg-teal-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{rb.label || rb.sport}</span>
                            {rb.user && (
                              <Badge className="bg-purple-900/50 text-purple-400 border-0 text-xs">
                                #{rb.user.uid}
                              </Badge>
                            )}
                            {!rb.user && rb.guestName && (
                              <Badge className="bg-orange-900/30 text-orange-400 border-0 text-xs">
                                {t('guest')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{DAYS_OF_WEEK[rb.dayOfWeek]}</span>
                            <span className="text-muted-foreground/70">|</span>
                            <span>{rb.court.name}</span>
                            <span className="text-muted-foreground/70">|</span>
                            <span>{rb.startTime} - {rb.endTime}</span>
                            {rb.user && (
                              <>
                                <span className="text-muted-foreground/70">|</span>
                                <span className="text-purple-400">{rb.user.name}</span>
                              </>
                            )}
                            {!rb.user && rb.guestName && (
                              <>
                                <span className="text-muted-foreground/70">|</span>
                                <span className="text-orange-400">{rb.guestName}</span>
                                {rb.guestPhone && (
                                  <>
                                    <span className="text-muted-foreground/70">|</span>
                                    <span className="text-orange-400">{rb.guestPhone}</span>
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
                          className="text-muted-foreground/70 hover:text-teal-400 hover:bg-teal-900/30"
                          onClick={() => openEditDialog(rb)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground/70 hover:text-red-400 hover:bg-red-900/30"
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
            <div className="bg-secondary rounded-xl p-5 border border-border">
              <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />
                {t('addNewRecurring')}
              </h4>

              <div className="space-y-5">
                {/* Label and Sport Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('bookingName')}</Label>
                    <Input
                      value={recurringLabel}
                      onChange={(e) => setRecurringLabel(e.target.value)}
                      placeholder={t('bookingNamePlaceholder')}
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('sportType')}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={recurringSport === 'badminton' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${recurringSport === 'badminton' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-card border-border text-muted-foreground'}`}
                        onClick={() => setRecurringSport('badminton')}
                      >
                        {t('badminton')}
                      </Button>
                      <Button
                        type="button"
                        variant={recurringSport === 'pickleball' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 ${recurringSport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : 'bg-card border-border text-muted-foreground'}`}
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
                    <Label className="text-xs font-medium text-muted-foreground">{t('daysOfWeek')}</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                        onClick={() => setRecurringDays([1, 2, 3, 4, 5])}
                      >
                        {t('weekdaysBtn')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                        onClick={() => setRecurringDays([0, 6])}
                      >
                        {t('weekendsBtn')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                        onClick={() => setRecurringDays([0, 1, 2, 3, 4, 5, 6])}
                      >
                        {t('allBtn')}
                      </Button>
                      {recurringDays.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground"
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
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-card border border-border text-muted-foreground hover:border-teal-700 hover:text-teal-400'
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
                    <Label className="text-xs font-medium text-muted-foreground">{t('courts')}</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/30"
                        onClick={() => setRecurringCourtIds(courts.map(c => c.id))}
                      >
                        {t('selectAll')}
                      </Button>
                      {recurringCourtIds.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground/70 hover:text-muted-foreground"
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
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-card border border-border text-muted-foreground hover:border-teal-700 hover:text-teal-400'
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
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('startTime')}</Label>
                    <Select value={recurringStartTime} onValueChange={(val) => {
                      setRecurringStartTime(val)
                      if (recurringEndTime && recurringEndTime <= val) {
                        setRecurringEndTime('')
                      }
                    }}>
                      <SelectTrigger className="bg-card border-border text-foreground">
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
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t('endTime')} {recurringSport === 'pickleball' && <span className="text-green-400 font-normal">({t('minHours')})</span>}
                    </Label>
                    <Select value={recurringEndTime} onValueChange={setRecurringEndTime} disabled={!recurringStartTime}>
                      <SelectTrigger className="bg-card border-border text-foreground">
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
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('endDate')} <span className="text-muted-foreground/70 font-normal">({t('optional')})</span></Label>
                    <Input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                </div>

                {/* Link to User by UID (optional) */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t('linkToUser')} <span className="text-muted-foreground/70 font-normal">({t('optional')})</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={recurringUserUid}
                      onChange={(e) => setRecurringUserUid(e.target.value)}
                      placeholder={t('enterUid')}
                      className="bg-card border-border text-foreground flex-1"
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
                        className="text-muted-foreground/70 hover:text-muted-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {recurringUser && (
                    <div className="mt-2 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-green-400">{recurringUser.name}</span>
                        <Badge className="bg-green-900/50 text-green-400 border-0 text-xs">
                          #{recurringUser.uid}
                        </Badge>
                      </div>
                      <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {recurringUser.phone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Guest Info (for non-registered users) */}
                {!recurringUser && (
                  <div className="border-t border-border pt-4">
                    <Label className="text-xs font-medium text-muted-foreground mb-3 block">
                      {t('orEnterGuest')}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('guestName')}</Label>
                        <Input
                          value={recurringGuestName}
                          onChange={(e) => setRecurringGuestName(e.target.value)}
                          placeholder={t('guestNamePlaceholder')}
                          className="bg-card border-border text-foreground"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('guestPhone')}</Label>
                        <PhoneInput
                          value={recurringGuestPhone}
                          onChange={(value) => {
                            setRecurringGuestPhone(value)
                            if (guestPhoneError) setGuestPhoneError('')
                          }}
                          className={guestPhoneError ? 'border-red-500 focus-within:ring-red-500' : ''}
                        />
                        {guestPhoneError && (
                          <p className="text-xs text-red-500 mt-1">{guestPhoneError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {recurringDays.length > 0 && recurringCourtIds.length > 0 && recurringStartTime && recurringEndTime && (
                  <div className="bg-teal-900/30 border border-teal-700 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-teal-900/50 rounded-md">
                        <Check className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-medium text-teal-400 text-sm">
                          {recurringDays.length * recurringCourtIds.length > 1
                            ? t('readyToCreatePlural', { count: recurringDays.length * recurringCourtIds.length })
                            : t('readyToCreate', { count: recurringDays.length * recurringCourtIds.length })}
                        </p>
                        <p className="text-teal-400 text-xs mt-1">
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

          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setRecurringDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddRecurring}
              className="bg-teal-600 hover:bg-teal-700 shadow-sm"
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
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-orange-900/30 rounded-lg">
                <Pencil className="w-5 h-5 text-orange-400" />
              </div>
              {t('editRecurring')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('editRecurringDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Label and Sport Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('bookingName')}</Label>
                <Input
                  value={recurringLabel}
                  onChange={(e) => setRecurringLabel(e.target.value)}
                  placeholder={t('bookingNamePlaceholder')}
                  className="bg-card border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('sportType')}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={recurringSport === 'badminton' ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${recurringSport === 'badminton' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-card border-border text-muted-foreground'}`}
                    onClick={() => setRecurringSport('badminton')}
                  >
                    {t('badminton')}
                  </Button>
                  <Button
                    type="button"
                    variant={recurringSport === 'pickleball' ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${recurringSport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : 'bg-card border-border text-muted-foreground'}`}
                    onClick={() => setRecurringSport('pickleball')}
                  >
                    {t('pickleball')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Day Selection (single day for edit) */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('dayOfWeek')}</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRecurringDays([idx])}
                    className={`py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                      recurringDays.includes(idx)
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-secondary border border-border text-muted-foreground hover:border-teal-700 hover:text-teal-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Court Selection (single court for edit) */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('court')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setRecurringCourtIds([court.id])}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      recurringCourtIds.includes(court.id)
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-secondary border border-border text-muted-foreground hover:border-teal-700 hover:text-teal-400'
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
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('startTime')}</Label>
                <Select value={recurringStartTime} onValueChange={(val) => {
                  setRecurringStartTime(val)
                  if (recurringEndTime && recurringEndTime <= val) {
                    setRecurringEndTime('')
                  }
                }}>
                  <SelectTrigger className="bg-card border-border text-foreground">
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
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('endTime')}</Label>
                <Select value={recurringEndTime} onValueChange={setRecurringEndTime} disabled={!recurringStartTime}>
                  <SelectTrigger className="bg-card border-border text-foreground">
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
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('endDate')} <span className="text-muted-foreground/70 font-normal">({t('optional')})</span></Label>
                <Input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  className="bg-card border-border text-foreground"
                />
              </div>
            </div>

            {/* Link to User by UID */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t('linkToUser')} <span className="text-muted-foreground/70 font-normal">({t('optional')})</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={recurringUserUid}
                  onChange={(e) => setRecurringUserUid(e.target.value)}
                  placeholder={t('enterUid')}
                  className="bg-card border-border text-foreground flex-1"
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
                    className="text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {recurringUser && (
                <div className="mt-2 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-green-400">{recurringUser.name}</span>
                    <Badge className="bg-green-900/50 text-green-400 border-0 text-xs">
                      #{recurringUser.uid}
                    </Badge>
                  </div>
                  <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {recurringUser.phone}
                  </div>
                </div>
              )}
            </div>

            {/* Guest Info (for non-registered users) */}
            {!recurringUser && (
              <div className="border-t border-border pt-4">
                <Label className="text-xs font-medium text-muted-foreground mb-3 block">
                  {t('orEnterGuest')}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('guestName')}</Label>
                    <Input
                      value={recurringGuestName}
                      onChange={(e) => setRecurringGuestName(e.target.value)}
                      placeholder={t('guestNamePlaceholder')}
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('guestPhone')}</Label>
                    <PhoneInput
                      value={recurringGuestPhone}
                      onChange={(value) => {
                        setRecurringGuestPhone(value)
                        if (guestPhoneError) setGuestPhoneError('')
                      }}
                      className={guestPhoneError ? 'border-red-500 focus-within:ring-red-500' : ''}
                    />
                    {guestPhoneError && (
                      <p className="text-xs text-red-500 mt-1">{guestPhoneError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4">
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
            {selectedPendingPaymentCount > 0 && (
              <span className="text-yellow-300 ml-1">({selectedPendingPaymentCount} pending)</span>
            )}
          </span>
          {selectedRecurringIds.size > 0 && (
            <Button
              size="sm"
              onClick={() => setBulkEditOpen(true)}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Bulk Edit
            </Button>
          )}
          {selectedPendingPaymentCount > 0 && (
            <Button
              size="sm"
              onClick={handleBulkConfirmPayment}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Confirm Payment{selectedPendingPaymentCount > 1 ? 's' : ''}
            </Button>
          )}
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
            className="text-muted-foreground/70 hover:text-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
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
              <div className="flex items-center gap-2 text-sm text-purple-400 bg-purple-900/50 p-2 rounded mb-2">
                <Repeat className="w-4 h-4" />
                {selectedRecurringIds.size} {t('recurringBookings')}
              </div>
            )}
            {selectedBookingIds.size > 0 && (
              <div className="flex items-center gap-2 text-sm text-teal-400 bg-teal-900/30 p-2 rounded">
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

      {/* Payment Confirmation Dialog */}
      {/* Receipt Verification Dialog */}
      <Dialog open={paymentConfirmOpen} onOpenChange={(open) => {
        setPaymentConfirmOpen(open)
        if (!open) {
          setBookingToConfirmPayment(null)
          setVerificationNotes('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Verify Payment Receipt
            </DialogTitle>
            <DialogDescription>
              Review the payment receipt and approve or reject.
            </DialogDescription>
          </DialogHeader>
          {bookingToConfirmPayment && (
            <div className="py-4 space-y-4">
              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium text-foreground">{bookingToConfirmPayment.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2 font-medium text-foreground">{bookingToConfirmPayment.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sport:</span>
                  <span className="ml-2 font-medium text-foreground capitalize">{bookingToConfirmPayment.sport}</span>
                </div>
                {bookingToConfirmPayment.paymentMethod && (
                  <div>
                    <span className="text-muted-foreground">Method:</span>
                    <span className="ml-2 font-medium text-foreground">{bookingToConfirmPayment.paymentMethod.toUpperCase()}</span>
                  </div>
                )}
                {bookingToConfirmPayment.totalAmount != null && (
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-bold text-green-400">RM {bookingToConfirmPayment.totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Image */}
              {bookingToConfirmPayment.paymentScreenshotUrl ? (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    Payment Receipt
                    <span className="text-xs text-muted-foreground/70">(Click to zoom)</span>
                  </p>
                  <div
                    className="relative cursor-zoom-in group"
                    onClick={() => {
                      setZoomedImageUrl(bookingToConfirmPayment.paymentScreenshotUrl!)
                      setImageZoomOpen(true)
                    }}
                  >
                    <img
                      src={bookingToConfirmPayment.paymentScreenshotUrl}
                      alt="Payment receipt"
                      className="max-w-full max-h-48 rounded-lg border border-border object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-secondary rounded-lg text-center text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/70" />
                  No receipt uploaded
                </div>
              )}

              {/* Notes Field */}
              <div>
                <Label htmlFor="verification-notes">Notes (visible to customer)</Label>
                <Textarea
                  id="verification-notes"
                  placeholder="Add notes about this verification (e.g., reason for rejection)"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Action Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg">
                  <p className="text-xs text-green-400">
                    <strong>Approve:</strong> Marks as paid & confirms booking
                  </p>
                </div>
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-xs text-red-400">
                    <strong>Reject:</strong> Cancels booking (customer notified)
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setPaymentConfirmOpen(false)
              setBookingToConfirmPayment(null)
              setVerificationNotes('')
            }}>
              {tAdmin('cancel')}
            </Button>
            <Button
              onClick={handleRejectPayment}
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog - Lightbox for receipt images */}
      <Dialog open={imageZoomOpen} onOpenChange={setImageZoomOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2 z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ZoomIn className="w-5 h-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {zoomedImageUrl && (
            <div className="flex items-center justify-center bg-secondary rounded-lg p-4">
              <img
                src={zoomedImageUrl}
                alt="Payment receipt (zoomed)"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageZoomOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog for Recurring Bookings */}
      <Dialog open={bulkEditOpen} onOpenChange={(open) => {
        setBulkEditOpen(open)
        if (!open) resetBulkEditForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <Pencil className="w-5 h-5" />
              Bulk Edit Recurring Bookings
            </DialogTitle>
            <DialogDescription>
              Edit {selectedRecurringIds.size} selected recurring booking{selectedRecurringIds.size > 1 ? 's' : ''}. Only fill in fields you want to change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* End Date */}
            <div>
              <Label>{t('endDate')} ({t('optional')})</Label>
              <Input
                type="date"
                value={bulkEditEndDate}
                onChange={(e) => setBulkEditEndDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <Label>Hourly Rate (RM)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Leave empty to keep current"
                value={bulkEditHourlyRate}
                onChange={(e) => setBulkEditHourlyRate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Label */}
            <div>
              <Label>{t('bookingName')}</Label>
              <Input
                placeholder="Leave empty to keep current"
                value={bulkEditLabel}
                onChange={(e) => setBulkEditLabel(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Assign to User */}
            <div>
              <Label>{t('assignToAccount')}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={bulkEditUserUid}
                  onChange={(e) => setBulkEditUserUid(e.target.value)}
                  placeholder={t('enterUid')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={searchUserForBulkEdit}
                  disabled={userSearchLoading || !bulkEditUserUid}
                >
                  {userSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {bulkEditUser && (
                <div className="mt-2 p-2 bg-teal-900/30 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{bulkEditUser.name}</p>
                    <p className="text-muted-foreground">{bulkEditUser.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBulkEditUser(null)
                      setBulkEditUserUid('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* OR Guest Info */}
            {!bulkEditUser && (
              <>
                <div className="flex items-center gap-2 text-muted-foreground/70 text-sm">
                  <div className="flex-1 h-px bg-accent" />
                  {t('or')}
                  <div className="flex-1 h-px bg-accent" />
                </div>

                <div>
                  <Label>{t('guestName')}</Label>
                  <Input
                    placeholder="Leave empty to keep current"
                    value={bulkEditGuestName}
                    onChange={(e) => setBulkEditGuestName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>{t('guestPhone')}</Label>
                  <PhoneInput
                    value={bulkEditGuestPhone}
                    onChange={setBulkEditGuestPhone}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkEditOpen(false)
              resetBulkEditForm()
            }}>
              {tAdmin('cancel')}
            </Button>
            <Button
              onClick={handleBulkEditRecurring}
              disabled={actionLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Update {selectedRecurringIds.size} Booking{selectedRecurringIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
