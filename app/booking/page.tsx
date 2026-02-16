'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, startOfDay, isBefore, addDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { CalendarDays, Clock, CreditCard, FlaskConical, Loader2, User, Smartphone, MessageCircle, Download, CheckCircle2, ImagePlus, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isAdmin } from '@/lib/admin'
import { toast } from 'sonner'
import { celebrateBooking } from '@/lib/confetti'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { TermsModal } from '@/components/TermsModal'

// Rates per 30-minute slot
const BADMINTON_RATE_PER_SLOT = 7.5 // RM7.50 per 30 min (RM15/hour)
const BADMINTON_PEAK_RATE_PER_SLOT = 9 // RM9 per 30 min (RM18/hour, 6 PM onwards)
const BADMINTON_PEAK_START = '18:00' // 6 PM
const PICKLEBALL_RATE_PER_SLOT = 12.5 // RM12.50 per 30 min (RM25/hour)

// Minimum slots required (each slot is 30 min)
const BADMINTON_MIN_SLOTS = 2 // 1 hour minimum
const PICKLEBALL_MIN_SLOTS = 4 // 2 hours minimum

// Format time slot to show 30-min range (e.g., "9:00 AM" -> "9:00 - 9:30 AM")
const formatTimeRange = (displayName: string): string => {
  // Parse the time (e.g., "9:00 AM" or "9:30 AM")
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
      endPeriod = 'AM' // midnight
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
  description: string | null
  hourlyRate: number
}

interface TimeSlot {
  id: number
  slotTime: string
  displayName: string
}

interface SlotAvailability extends TimeSlot {
  available: boolean
  isPast?: boolean
}

interface CourtAvailability {
  court: Court
  slots: SlotAvailability[]
}

interface SelectedSlot {
  courtId: number
  courtName: string
  slotTime: string
  displayName: string
  slotRate: number // Rate per 30-min slot
}

type Sport = 'badminton' | 'pickleball'

function BookingPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin)
  const t = useTranslations('booking')
  const tCommon = useTranslations('common')
  const tHome = useTranslations('home')

  // Get sport from URL query param, default to badminton
  const initialSport = searchParams.get('sport') === 'pickleball' ? 'pickleball' : 'badminton'
  const [sport, setSport] = useState<Sport>(initialSport)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availability, setAvailability] = useState<CourtAvailability[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Guest booking form state
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // TNG payment modal state
  const [showTngModal, setShowTngModal] = useState(false)
  const [tngBookingCreated, setTngBookingCreated] = useState(false)
  const [, setTngBookingIds] = useState<string[]>([])
  const [tngHasPaid, setTngHasPaid] = useState(false)

  // DuitNow payment modal state
  const [showDuitNowModal, setShowDuitNowModal] = useState(false)
  const [duitNowBookingCreated, setDuitNowBookingCreated] = useState(false)
  const [, setDuitNowBookingIds] = useState<string[]>([])
  const [duitNowHasPaid, setDuitNowHasPaid] = useState(false)

  // Receipt upload state
  const [tngReceiptFile, setTngReceiptFile] = useState<File | null>(null)
  const [tngReceiptPreview, setTngReceiptPreview] = useState<string | null>(null)
  const [duitNowReceiptFile, setDuitNowReceiptFile] = useState<File | null>(null)
  const [duitNowReceiptPreview, setDuitNowReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const tTerms = useTranslations('terms')

  // Download QR code to gallery
  const downloadQrCode = async (qrType: 'tng' | 'duitnow') => {
    const imagePath = qrType === 'tng' ? '/images/tng-qr.png' : '/images/duitnow-qr.png'
    const filename = qrType === 'tng' ? 'TZH-TouchNGo-QR.png' : 'TZH-DuitNow-QR.png'

    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('QR code saved to your device!')
    } catch (_err) {
      toast.error('Failed to download QR code')
    }
  }

  // Receipt upload handlers
  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'tng' | 'duitnow') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidFileType') || 'Invalid file type. Please upload an image.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge') || 'File too large. Maximum size is 5MB.')
      return
    }

    const previewUrl = URL.createObjectURL(file)

    if (type === 'tng') {
      setTngReceiptFile(file)
      setTngReceiptPreview(previewUrl)
    } else {
      setDuitNowReceiptFile(file)
      setDuitNowReceiptPreview(previewUrl)
    }
  }

  const removeReceipt = (type: 'tng' | 'duitnow') => {
    if (type === 'tng') {
      if (tngReceiptPreview) URL.revokeObjectURL(tngReceiptPreview)
      setTngReceiptFile(null)
      setTngReceiptPreview(null)
    } else {
      if (duitNowReceiptPreview) URL.revokeObjectURL(duitNowReceiptPreview)
      setDuitNowReceiptFile(null)
      setDuitNowReceiptPreview(null)
    }
  }

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      return data.url
    } catch (error) {
      console.error('Error uploading receipt:', error)
      return null
    }
  }

  // Fix hydration mismatch by only rendering calendar after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Clear selected slots when sport changes
  useEffect(() => {
    setSelectedSlots([])
  }, [sport])

  // Fetch availability when date changes
  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const res = await fetch(`/api/availability?date=${dateStr}`)
      const data = await res.json()
      setAvailability(data.availability || [])
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
  }, [selectedDate])

  // Get rate per 30-minute slot based on sport and time
  const getSlotRate = (slotTime?: string) => {
    if (sport === 'pickleball') return PICKLEBALL_RATE_PER_SLOT
    // Badminton: check if peak hours (6 PM onwards)
    if (slotTime && slotTime >= BADMINTON_PEAK_START) {
      return BADMINTON_PEAK_RATE_PER_SLOT
    }
    return BADMINTON_RATE_PER_SLOT
  }

  // Get minimum slots required for current sport
  const getMinSlots = () => sport === 'pickleball' ? PICKLEBALL_MIN_SLOTS : BADMINTON_MIN_SLOTS

  // Check if a slot is adjacent to any selected slot on the same court
  const isAdjacentToSelection = (courtId: number, slotTime: string): boolean => {
    const courtSlots = selectedSlots.filter(s => s.courtId === courtId)
    if (courtSlots.length === 0) return false

    const courtAvailability = availability.find(ca => ca.court.id === courtId)
    if (!courtAvailability) return false

    const currentIndex = courtAvailability.slots.findIndex(s => s.slotTime === slotTime)
    if (currentIndex === -1) return false

    // Check if previous or next slot is selected
    const prevSlot = currentIndex > 0 ? courtAvailability.slots[currentIndex - 1] : null
    const nextSlot = currentIndex < courtAvailability.slots.length - 1 ? courtAvailability.slots[currentIndex + 1] : null

    const prevSelected = prevSlot ? isSlotSelected(courtId, prevSlot.slotTime) : false
    const nextSelected = nextSlot ? isSlotSelected(courtId, nextSlot.slotTime) : false

    return prevSelected || nextSelected
  }

  // Get consecutive available slots starting from a slot
  const getConsecutiveAvailableSlots = (court: Court, startSlotTime: string, count: number): SlotAvailability[] => {
    const courtAvailability = availability.find(ca => ca.court.id === court.id)
    if (!courtAvailability) return []

    const startIndex = courtAvailability.slots.findIndex(s => s.slotTime === startSlotTime)
    if (startIndex === -1) return []

    const slots: SlotAvailability[] = []
    for (let i = 0; i < count && startIndex + i < courtAvailability.slots.length; i++) {
      const slot = courtAvailability.slots[startIndex + i]
      if (!slot.available) break
      slots.push(slot)
    }
    return slots
  }

  // Check if removing a slot would break continuity
  const wouldBreakContinuity = (courtId: number, slotTimeToRemove: string): boolean => {
    const courtSlots = selectedSlots
      .filter(s => s.courtId === courtId && s.slotTime !== slotTimeToRemove)
      .sort((a, b) => a.slotTime.localeCompare(b.slotTime))

    if (courtSlots.length <= 1) return false

    const courtAvailability = availability.find(ca => ca.court.id === courtId)
    if (!courtAvailability) return false

    // Check if remaining slots are consecutive
    for (let i = 0; i < courtSlots.length - 1; i++) {
      const currentIndex = courtAvailability.slots.findIndex(s => s.slotTime === courtSlots[i].slotTime)
      const nextIndex = courtAvailability.slots.findIndex(s => s.slotTime === courtSlots[i + 1].slotTime)
      if (nextIndex !== currentIndex + 1) return true
    }
    return false
  }

  // Toggle slot selection
  const toggleSlot = (court: Court, slot: SlotAvailability) => {
    if (!slot.available) return

    const existing = selectedSlots.find(
      (s) => s.courtId === court.id && s.slotTime === slot.slotTime
    )

    const courtSlotsCount = selectedSlots.filter(s => s.courtId === court.id).length
    const minSlots = getMinSlots()

    if (existing) {
      // Removing a slot
      // If at minimum, clear ALL slots for this court (allow fresh start)
      if (courtSlotsCount <= minSlots) {
        setSelectedSlots(selectedSlots.filter((s) => s.courtId !== court.id))
        return
      }

      // Check if removing would break continuity
      if (wouldBreakContinuity(court.id, slot.slotTime)) {
        toast.error('Cannot remove this slot as it would create a gap in your booking.')
        return
      }

      setSelectedSlots(selectedSlots.filter((s) => s !== existing))
    } else {
      // Adding a slot
      if (courtSlotsCount === 0) {
        // First selection - need to add minimum slots
        const consecutiveSlots = getConsecutiveAvailableSlots(court, slot.slotTime, minSlots)

        if (consecutiveSlots.length < minSlots) {
          const minTime = sport === 'pickleball' ? '2 hours' : '1 hour'
          toast.error(`${sport.charAt(0).toUpperCase() + sport.slice(1)} requires ${minTime} minimum. Not enough consecutive slots available.`)
          return
        }

        const newSlots = consecutiveSlots.map(s => ({
          courtId: court.id,
          courtName: court.name,
          slotTime: s.slotTime,
          displayName: s.displayName,
          slotRate: getSlotRate(s.slotTime),
        }))

        setSelectedSlots([...selectedSlots, ...newSlots])
      } else {
        // Already have slots - only allow adjacent additions
        if (!isAdjacentToSelection(court.id, slot.slotTime)) {
          toast.error('You can only add slots that are adjacent to your existing booking.')
          return
        }

        setSelectedSlots([
          ...selectedSlots,
          {
            courtId: court.id,
            courtName: court.name,
            slotTime: slot.slotTime,
            displayName: slot.displayName,
            slotRate: getSlotRate(slot.slotTime),
          },
        ])
      }
    }
  }

  // Check if a slot is selected
  const isSlotSelected = (courtId: number, slotTime: string) => {
    return selectedSlots.some(
      (s) => s.courtId === courtId && s.slotTime === slotTime
    )
  }

  // Calculate total (sum of all slot rates)
  const total = selectedSlots.reduce((sum, slot) => sum + slot.slotRate, 0)

  // Validate minimum booking requirement
  const validateMinimum = () => {
    const minSlots = getMinSlots()
    if (selectedSlots.length < minSlots) {
      const minTime = sport === 'pickleball' ? '2 hours' : '1 hour'
      toast.error(`${sport.charAt(0).toUpperCase() + sport.slice(1)} requires a minimum of ${minTime} booking`)
      return false
    }
    return true
  }

  // Handle test booking (admin only)
  const handleTestBooking = async () => {
    if (!validateMinimum()) return

    if (!session) {
      router.push('/auth/login?callbackUrl=/booking')
      return
    }

    setBooking(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: selectedSlots.map((s) => ({
            courtId: s.courtId,
            slotTime: s.slotTime,
            slotRate: s.slotRate,
          })),
          date: format(selectedDate, 'yyyy-MM-dd'),
          sport,
          isTestBooking: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create booking')
        return
      }

      // Success! Show confetti and toast
      celebrateBooking()
      toast.success(`Booking created! ${data.count} slot(s) booked.`, {
        duration: 5000,
      })
      setSelectedSlots([])
      // Refresh availability
      await fetchAvailability()
    } catch (_err) {
      toast.error('An unexpected error occurred')
    } finally {
      setBooking(false)
    }
  }

  // Handle TNG payment - show QR code modal
  const handleTngPayment = async () => {
    if (!validateMinimum()) return

    // For guests, require name and phone
    if (!session) {
      if (!guestName.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!guestPhone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
    }

    // Show the TNG modal
    setShowTngModal(true)
    setTngBookingCreated(false)
    setTngHasPaid(false)
  }

  // Create TNG booking after user confirms they've paid
  const handleTngBookingConfirm = async () => {
    setBooking(true)

    try {
      // Upload receipt if provided
      let receiptUrl: string | null = null
      if (tngReceiptFile) {
        setUploadingReceipt(true)
        receiptUrl = await uploadReceipt(tngReceiptFile)
        setUploadingReceipt(false)
        if (!receiptUrl) {
          toast.error(t('uploadFailed') || 'Failed to upload receipt. Please try again.')
          setBooking(false)
          return
        }
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: selectedSlots.map((s) => ({
            courtId: s.courtId,
            slotTime: s.slotTime,
            slotRate: s.slotRate,
          })),
          date: format(selectedDate, 'yyyy-MM-dd'),
          sport,
          isGuestBooking: !session,
          guestName: guestName.trim() || session?.user?.name,
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || session?.user?.email,
          paymentMethod: 'tng', // Mark as TNG payment
          paymentUserConfirmed: true, // User confirmed they have paid via toggle
          receiptUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create booking')
        return
      }

      // Success!
      setTngBookingCreated(true)
      setTngBookingIds(data.bookingIds || [])
      celebrateBooking()

      // Refresh availability
      await fetchAvailability()
      setSelectedSlots([])
    } catch (_err) {
      toast.error('An unexpected error occurred')
    } finally {
      setBooking(false)
    }
  }

  // Close TNG modal and reset state
  const closeTngModal = () => {
    setShowTngModal(false)
    setTngBookingCreated(false)
    setTngBookingIds([])
    setTngHasPaid(false)
  }

  // Handle DuitNow payment - show QR code modal
  const handleDuitNowPayment = async () => {
    if (!validateMinimum()) return

    // For guests, require name and phone
    if (!session) {
      if (!guestName.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!guestPhone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
    }

    // Show the DuitNow modal
    setShowDuitNowModal(true)
    setDuitNowBookingCreated(false)
    setDuitNowHasPaid(false)
  }

  // Create DuitNow booking after user confirms they've paid
  const handleDuitNowBookingConfirm = async () => {
    setBooking(true)

    try {
      // Upload receipt if provided
      let receiptUrl: string | null = null
      if (duitNowReceiptFile) {
        setUploadingReceipt(true)
        receiptUrl = await uploadReceipt(duitNowReceiptFile)
        setUploadingReceipt(false)
        if (!receiptUrl) {
          toast.error(t('uploadFailed') || 'Failed to upload receipt. Please try again.')
          setBooking(false)
          return
        }
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: selectedSlots.map((s) => ({
            courtId: s.courtId,
            slotTime: s.slotTime,
            slotRate: s.slotRate,
          })),
          date: format(selectedDate, 'yyyy-MM-dd'),
          sport,
          isGuestBooking: !session,
          guestName: guestName.trim() || session?.user?.name,
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || session?.user?.email,
          paymentMethod: 'duitnow', // Mark as DuitNow payment
          paymentUserConfirmed: true, // User confirmed they have paid via toggle
          receiptUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create booking')
        return
      }

      // Success!
      setDuitNowBookingCreated(true)
      setDuitNowBookingIds(data.bookingIds || [])
      celebrateBooking()

      // Refresh availability
      await fetchAvailability()
      setSelectedSlots([])
    } catch (_err) {
      toast.error('An unexpected error occurred')
    } finally {
      setBooking(false)
    }
  }

  // Close DuitNow modal and reset state
  const closeDuitNowModal = () => {
    setShowDuitNowModal(false)
    setDuitNowBookingCreated(false)
    setDuitNowBookingIds([])
    setDuitNowHasPaid(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('selectSport')}, {t('selectDate')}, {t('selectTime')}
        </p>
      </div>

      {/* Sport Tabs */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSport('badminton')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                sport === 'badminton'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tHome('sports.badminton')}
            </button>
            <button
              onClick={() => setSport('pickleball')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                sport === 'pickleball'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tHome('sports.pickleball')}
            </button>
          </nav>
        </div>

        {/* Pricing & Minimum Booking Info Banner */}
        <div className="mt-4 p-4 rounded-2xl border border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-card">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-lg text-foreground">
                  {sport === 'badminton' ? (
                    <>RM15/hr before 6PM <span className="text-muted-foreground">•</span> RM18/hr after 6PM</>
                  ) : (
                    <>RM25/hr all day</>
                  )}
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-primary text-white">
              <p className="font-medium">
                {sport === 'badminton'
                  ? 'Min: 1 Hour'
                  : 'Min: 2 Hours'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Calendar and Time Slots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selection */}
          <Card className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-forwards">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                {t('selectDate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mounted ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) =>
                    isBefore(date, startOfDay(new Date())) ||
                    isBefore(addDays(new Date(), 30), date)
                  }
                  className="rounded-md border border-border"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots Grid */}
          <Card className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100 fill-mode-forwards">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('selectTime')} - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                <Badge
                  variant="outline"
                  className="ml-2 bg-secondary"
                >
                  {sport === 'badminton' ? tHome('sports.badminton') : tHome('sports.pickleball')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tCommon('loading')}
                </div>
              ) : availability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noSlots')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse rounded-lg overflow-hidden border border-border">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                          Time
                        </th>
                        {availability.map((ca) => (
                          <th
                            key={ca.court.id}
                            className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-l border-border"
                          >
                            {ca.court.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {availability[0]?.slots.map((slot, idx) => (
                        <tr key={slot.id} className="bg-background">
                          <td className="p-3 text-sm font-medium text-foreground border-b border-border whitespace-nowrap">
                            {formatTimeRange(slot.displayName)}
                          </td>
                          {availability.map((ca) => {
                            const courtSlot = ca.slots[idx]
                            const selected = isSlotSelected(ca.court.id, courtSlot.slotTime)
                            return (
                              <td key={ca.court.id} className="p-1.5 border-b border-l border-border">
                                <button
                                  onClick={() => toggleSlot(ca.court, courtSlot)}
                                  disabled={!courtSlot.available}
                                  className={`w-full py-2.5 px-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    !courtSlot.available
                                      ? 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                                      : selected
                                      ? 'bg-primary text-white shadow-sm'
                                      : 'bg-card border border-border text-foreground hover:border-primary hover:bg-primary/5'
                                  }`}
                                >
                                  {!courtSlot.available
                                    ? courtSlot.isPast
                                      ? t('past') || 'Past'
                                      : t('booked')
                                    : selected
                                    ? t('selected')
                                    : t('available')}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 sm:top-24 animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-forwards">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('confirmBooking')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('selectAtLeast')}
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>{t('selectSport')}:</strong>{' '}
                      <span className="text-foreground font-medium">
                        {sport === 'badminton' ? tHome('sports.badminton') : tHome('sports.pickleball')}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('selectDate')}:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{t('selectedSlots')}:</p>
                    {selectedSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-secondary rounded"
                      >
                        <div>
                          <Badge variant="outline" className="mr-2">
                            {slot.courtName}
                          </Badge>
                          <span className="text-sm">{formatTimeRange(slot.displayName)}</span>
                        </div>
                        <span className="text-sm font-medium">
                          RM{slot.slotRate.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">{t('totalAmount')}:</span>
                      <span className="text-xl font-bold">RM{total.toFixed(2)}</span>
                    </div>

                    {/* Guest Booking Form */}
                    {!session && (
                      <div className="space-y-3 mb-4 p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <User className="w-4 h-4" />
                          {t('guest.title')}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="guestName" className="text-xs">{t('guest.name')} *</Label>
                            <Input
                              id="guestName"
                              placeholder={t('guest.name')}
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="guestPhone" className="text-xs">{t('guest.phone')} *</Label>
                            <PhoneInput
                              id="guestPhone"
                              value={guestPhone}
                              onChange={setGuestPhone}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="guestEmail" className="text-xs">{t('guest.email')}</Label>
                            <Input
                              id="guestEmail"
                              type="email"
                              placeholder="email@example.com"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Terms & Conditions checkbox */}
                    <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-secondary">
                      <Checkbox
                        id="terms-agree"
                        checked={termsAgreed}
                        onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                        className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor="terms-agree" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        {tTerms('agreeCheckbox')}{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setTermsModalOpen(true)
                          }}
                          className="text-primary hover:underline font-medium"
                        >
                          {tTerms('termsLink')}
                        </button>
                      </label>
                    </div>

                    {/* Touch 'n Go payment button */}
                    <Button
                      className="w-full mb-2 bg-primary hover:bg-primary/90 rounded-full"
                      size="lg"
                      onClick={handleTngPayment}
                      disabled={booking || !termsAgreed}
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      {t('bookNow')} - {t('paymentMethods.tng')}
                    </Button>

                    {/* DuitNow payment button */}
                    <Button
                      variant="outline"
                      className="w-full mb-2 border-border text-foreground hover:bg-secondary hover:border-primary rounded-full"
                      size="lg"
                      onClick={handleDuitNowPayment}
                      disabled={booking || !termsAgreed}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('bookNow')} - {t('paymentMethods.duitnow')}
                    </Button>

                    {/* Admin test booking button */}
                    {userIsAdmin && (
                      <Button
                        variant="outline"
                        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                        size="lg"
                        onClick={handleTestBooking}
                        disabled={booking}
                      >
                        {booking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {tCommon('loading')}
                          </>
                        ) : (
                          <>
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Test Book (Admin)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Operating Hours - inside the sticky card */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{tHome('info.hours.title')}</p>
                      <p className="text-muted-foreground">{tHome('info.hours.weekdays')}</p>
                      <p className="text-muted-foreground">{tHome('info.hours.weekends')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{tHome('info.contact.title')}</p>
                      <p className="text-muted-foreground"><a href="tel:+60116868508" className="hover:text-foreground transition-colors">011-6868 8508</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Touch 'n Go Payment Modal - Mobile-First Design */}
      <Dialog open={showTngModal} onOpenChange={setShowTngModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-foreground" />
              Pay with {t('paymentMethods.tng')}
            </DialogTitle>
          </DialogHeader>

          {!tngBookingCreated ? (
            <div className="space-y-4">
              {/* Amount Banner */}
              <div className="bg-primary text-white rounded-xl p-4 text-center">
                <p className="text-sm opacity-90">Amount to pay</p>
                <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
              </div>

              {/* Step 1: Save QR Code */}
              <div className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <h4 className="font-semibold text-foreground">Save the QR Code</h4>
                </div>
                <div className="flex justify-center">
                  <div className="p-3 bg-card rounded-lg border-2 border-border">
                    <img
                      src="/images/tng-qr.png"
                      alt={`${t('paymentMethods.tng')} QR Code`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `
                          <div class="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-card rounded-lg text-center p-4">
                            <p class="text-sm text-muted-foreground">QR Code placeholder</p>
                          </div>
                        `
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base border-2 border-border text-foreground hover:bg-secondary"
                  onClick={() => downloadQrCode('tng')}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Save QR Code to Gallery
                </Button>
                <p className="text-xs text-center text-muted-foreground">Tap to save this QR code to your phone</p>
              </div>

              {/* Step 2-5: Instructions */}
              <div className="space-y-3">
                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-foreground">Open {t('paymentMethods.tng')} App</p>
                    <p className="text-sm text-muted-foreground">Open your {t('paymentMethods.tng')} eWallet app</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-foreground">Scan from Gallery</p>
                    <p className="text-sm text-muted-foreground">Tap &apos;Scan&apos;, then select the QR code from your gallery</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium text-foreground">Enter Amount</p>
                    <p className="text-sm text-muted-foreground">Enter exactly <strong className="text-foreground">RM{total.toFixed(2)}</strong></p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">5</div>
                  <div>
                    <p className="font-medium text-foreground">Complete Payment</p>
                    <p className="text-sm text-muted-foreground">Confirm and complete the payment in your app</p>
                  </div>
                </div>

                {/* Step 6: Upload Receipt */}
                <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('uploadReceipt') || 'Upload Payment Receipt'}</h4>
                      <p className="text-sm text-muted-foreground">{t('uploadReceiptDesc') || 'Upload a screenshot of your payment confirmation for faster verification.'}</p>
                    </div>
                  </div>

                  {tngReceiptPreview ? (
                    <div className="relative">
                      <img
                        src={tngReceiptPreview}
                        alt="Receipt preview"
                        className="w-full max-h-48 object-contain rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeReceipt('tng')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('receiptUploaded') || 'Receipt uploaded'}
                      </p>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-secondary/50 transition-colors">
                        <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">{t('tapToUpload') || 'Tap to upload receipt'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('maxFileSize') || 'Max 5MB (JPG, PNG)'}</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleReceiptSelect(e, 'tng')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* "I have paid" Toggle */}
              <div className="bg-card border-2 border-primary/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tngHasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    <Label htmlFor="tng-paid-toggle" className="text-base font-semibold text-foreground cursor-pointer">
                      I have paid
                    </Label>
                  </div>
                  <Switch
                    id="tng-paid-toggle"
                    checked={tngHasPaid}
                    onCheckedChange={setTngHasPaid}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only turn this on after you have successfully paid in {t('paymentMethods.tng')}
                </p>
              </div>

              {/* Confirm Button */}
              <Button
                className={`w-full h-14 text-lg font-semibold ${tngHasPaid ? 'bg-primary hover:bg-primary/90' : 'bg-accent cursor-not-allowed'}`}
                size="lg"
                onClick={handleTngBookingConfirm}
                disabled={!tngHasPaid || booking || uploadingReceipt}
              >
                {booking || uploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadingReceipt ? (t('uploadingReceipt') || 'Uploading receipt...') : 'Creating Booking...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirm My Booking
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                This will submit your booking for payment verification
              </p>
            </div>
          ) : (
            // Success state
            <div className="space-y-4 text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Booking Created!</h3>
              <p className="text-muted-foreground">
                Your booking is pending payment verification.
                {tngReceiptFile && <span className="block text-green-600 font-medium mt-1">Receipt uploaded!</span>}
              </p>
              <Button className="w-full h-12 text-base" onClick={closeTngModal}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions Modal */}
      <TermsModal open={termsModalOpen} onOpenChange={setTermsModalOpen} />

      {/* DuitNow Payment Modal - Mobile-First Design */}
      <Dialog open={showDuitNowModal} onOpenChange={setShowDuitNowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-foreground" />
              Pay with {t('paymentMethods.duitnow')}
            </DialogTitle>
          </DialogHeader>

          {!duitNowBookingCreated ? (
            <div className="space-y-4">
              {/* Amount Banner */}
              <div className="bg-primary text-white rounded-xl p-4 text-center">
                <p className="text-sm opacity-90">Amount to pay</p>
                <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
              </div>

              {/* Step 1: Save QR Code */}
              <div className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <h4 className="font-semibold text-foreground">Save the QR Code</h4>
                </div>
                <div className="flex justify-center">
                  <div className="p-3 bg-card rounded-lg border-2 border-border">
                    <img
                      src="/images/duitnow-qr.png"
                      alt={`${t('paymentMethods.duitnow')} QR Code`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `
                          <div class="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-card rounded-lg text-center p-4">
                            <p class="text-sm text-muted-foreground">QR Code placeholder</p>
                          </div>
                        `
                      }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base border-2 border-border text-foreground hover:bg-secondary"
                  onClick={() => downloadQrCode('duitnow')}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Save QR Code to Gallery
                </Button>
                <p className="text-xs text-center text-muted-foreground">Tap to save this QR code to your phone</p>
              </div>

              {/* Step 2-5: Instructions */}
              <div className="space-y-3">
                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-foreground">Open Your Banking App</p>
                    <p className="text-sm text-muted-foreground">Maybank, CIMB, RHB, Public Bank, etc.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-foreground">Scan from Gallery</p>
                    <p className="text-sm text-muted-foreground">Tap &apos;Scan &amp; Pay&apos; or &apos;{t('paymentMethods.duitnow')} QR&apos;, then select from gallery</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium text-foreground">Enter Amount</p>
                    <p className="text-sm text-muted-foreground">Enter exactly <strong className="text-foreground">RM{total.toFixed(2)}</strong></p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">5</div>
                  <div>
                    <p className="font-medium text-foreground">Complete Payment</p>
                    <p className="text-sm text-muted-foreground">Confirm and complete the payment in your app</p>
                  </div>
                </div>

                {/* Step 6: Upload Receipt */}
                <div className="bg-secondary rounded-xl p-4 space-y-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('uploadReceipt') || 'Upload Payment Receipt'}</h4>
                      <p className="text-sm text-muted-foreground">{t('uploadReceiptDesc') || 'Upload a screenshot of your payment confirmation for faster verification.'}</p>
                    </div>
                  </div>

                  {duitNowReceiptPreview ? (
                    <div className="relative">
                      <img
                        src={duitNowReceiptPreview}
                        alt="Receipt preview"
                        className="w-full max-h-48 object-contain rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeReceipt('duitnow')}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('receiptUploaded') || 'Receipt uploaded'}
                      </p>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-secondary/50 transition-colors">
                        <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">{t('tapToUpload') || 'Tap to upload receipt'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('maxFileSize') || 'Max 5MB (JPG, PNG)'}</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleReceiptSelect(e, 'duitnow')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* "I have paid" Toggle */}
              <div className="bg-card border-2 border-primary/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {duitNowHasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    <Label htmlFor="duitnow-paid-toggle" className="text-base font-semibold text-foreground cursor-pointer">
                      I have paid
                    </Label>
                  </div>
                  <Switch
                    id="duitnow-paid-toggle"
                    checked={duitNowHasPaid}
                    onCheckedChange={setDuitNowHasPaid}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only turn this on after you have successfully paid via {t('paymentMethods.duitnow')}
                </p>
              </div>

              {/* Confirm Button */}
              <Button
                className={`w-full h-14 text-lg font-semibold ${duitNowHasPaid ? 'bg-primary hover:bg-primary/90' : 'bg-accent cursor-not-allowed'}`}
                size="lg"
                onClick={handleDuitNowBookingConfirm}
                disabled={!duitNowHasPaid || booking || uploadingReceipt}
              >
                {booking || uploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadingReceipt ? (t('uploadingReceipt') || 'Uploading receipt...') : 'Creating Booking...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirm My Booking
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                This will submit your booking for payment verification
              </p>
            </div>
          ) : (
            // Success state
            <div className="space-y-4 text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Booking Created!</h3>
              <p className="text-muted-foreground">
                Your booking is pending payment verification.
                {duitNowReceiptFile && <span className="block text-green-600 font-medium mt-1">Receipt uploaded!</span>}
              </p>
              <Button className="w-full h-12 text-base" onClick={closeDuitNowModal}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}
