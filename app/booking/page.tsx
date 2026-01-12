'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarDays, Clock, CreditCard, FlaskConical, Loader2, User } from 'lucide-react'
import { isAdmin } from '@/lib/admin'

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
  const userIsAdmin = isAdmin(session?.user?.email)

  // Get sport from URL query param, default to badminton
  const initialSport = searchParams.get('sport') === 'pickleball' ? 'pickleball' : 'badminton'
  const [sport, setSport] = useState<Sport>(initialSport)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availability, setAvailability] = useState<CourtAvailability[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)

  // Guest booking form state
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // Fix hydration mismatch by only rendering calendar after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Clear selected slots when sport changes
  useEffect(() => {
    setSelectedSlots([])
    setError('')
    setSuccess('')
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

  // Get the next consecutive slot for a court
  const getNextSlot = (court: Court, currentSlotTime: string): SlotAvailability | null => {
    const courtAvailability = availability.find(ca => ca.court.id === court.id)
    if (!courtAvailability) return null

    const currentIndex = courtAvailability.slots.findIndex(s => s.slotTime === currentSlotTime)
    if (currentIndex === -1 || currentIndex >= courtAvailability.slots.length - 1) return null

    return courtAvailability.slots[currentIndex + 1]
  }

  // Get the previous slot for a court
  const getPreviousSlot = (court: Court, currentSlotTime: string): SlotAvailability | null => {
    const courtAvailability = availability.find(ca => ca.court.id === court.id)
    if (!courtAvailability) return null

    const currentIndex = courtAvailability.slots.findIndex(s => s.slotTime === currentSlotTime)
    if (currentIndex <= 0) return null

    return courtAvailability.slots[currentIndex - 1]
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
    setError('')
    setSuccess('')

    const existing = selectedSlots.find(
      (s) => s.courtId === court.id && s.slotTime === slot.slotTime
    )

    const courtSlotsCount = selectedSlots.filter(s => s.courtId === court.id).length
    const minSlots = getMinSlots()

    if (existing) {
      // Removing a slot
      // Check if this would go below minimum
      if (courtSlotsCount <= minSlots) {
        // Remove all slots for this court
        setSelectedSlots(selectedSlots.filter(s => s.courtId !== court.id))
        return
      }

      // Check if removing would break continuity
      if (wouldBreakContinuity(court.id, slot.slotTime)) {
        setError('Cannot remove this slot as it would create a gap in your booking.')
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
          setError(`${sport.charAt(0).toUpperCase() + sport.slice(1)} requires ${minTime} minimum. Not enough consecutive slots available.`)
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
          setError('You can only add slots that are adjacent to your existing booking.')
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

  // Calculate total duration in hours
  const totalHours = selectedSlots.length * 0.5

  // Validate minimum booking requirement
  const validateMinimum = () => {
    const minSlots = getMinSlots()
    if (selectedSlots.length < minSlots) {
      const minTime = sport === 'pickleball' ? '2 hours' : '1 hour'
      setError(`${sport.charAt(0).toUpperCase() + sport.slice(1)} requires a minimum of ${minTime} booking`)
      return false
    }
    return true
  }

  // Handle guest booking
  const handleGuestBooking = async () => {
    if (!validateMinimum()) return

    if (!guestName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!guestPhone.trim()) {
      setError('Please enter your phone number')
      return
    }

    setBooking(true)
    setError('')
    setSuccess('')

    try {
      // Create the regular booking
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
          isGuestBooking: true,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create booking')
        return
      }

      setSuccess(`Booking confirmed! ${data.count} slot(s) booked. Please pay at counter.`)
      setSelectedSlots([])
      setGuestName('')
      setGuestPhone('')
      setGuestEmail('')
      // Refresh availability
      await fetchAvailability()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setBooking(false)
    }
  }

  // Handle test booking (admin only)
  const handleTestBooking = async () => {
    if (!validateMinimum()) return

    if (!session) {
      router.push('/auth/login?callbackUrl=/booking')
      return
    }

    setBooking(true)
    setError('')
    setSuccess('')

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
        setError(data.error || 'Failed to create booking')
        return
      }

      setSuccess(`Booking created! ${data.count} slot(s) booked.`)
      setSelectedSlots([])
      // Refresh availability
      await fetchAvailability()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Court</h1>
        <p className="text-gray-600">
          Select your sport, preferred date, time slots, and courts
        </p>
      </div>

      {/* Sport Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSport('badminton')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                sport === 'badminton'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Badminton
              <span className="ml-2 text-xs text-gray-400">RM15/hr (RM18 after 6PM) • 1hr min</span>
            </button>
            <button
              onClick={() => setSport('pickleball')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                sport === 'pickleball'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pickleball
              <span className="ml-2 text-xs text-gray-400">RM25/hr • 2hr min</span>
            </button>
          </nav>
        </div>

        {/* Sport Image Banner */}
        <div className="mt-4 relative h-40 rounded-lg overflow-hidden">
          {sport === 'badminton' ? (
            <div className="relative w-full h-full">
              <img
                src="https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=1200&q=80"
                alt="Badminton player in action"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/70 to-transparent flex items-center">
                <div className="px-6 text-white">
                  <h3 className="text-2xl font-bold">Badminton</h3>
                  <p className="text-sm opacity-90">Book your court • 1 hour minimum</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <img
                src="https://images.unsplash.com/photo-1612534847738-b3af9bc31f0c?w=1200&q=80"
                alt="Pickleball equipment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/70 to-transparent flex items-center">
                <div className="px-6 text-white">
                  <h3 className="text-2xl font-bold">Pickleball</h3>
                  <p className="text-sm opacity-90">Book your court • 2 hour minimum</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Calendar and Time Slots */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Select Date
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
                  className="rounded-md border"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Select Time Slots - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                <Badge
                  variant="outline"
                  className={sport === 'badminton' ? 'ml-2 bg-blue-50' : 'ml-2 bg-green-50'}
                >
                  {sport === 'badminton' ? 'Badminton' : 'Pickleball'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading availability...
                </div>
              ) : availability.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courts available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-medium text-gray-600 border-b">
                          Time
                        </th>
                        {availability.map((ca) => (
                          <th
                            key={ca.court.id}
                            className="p-2 text-center text-sm font-medium text-gray-600 border-b"
                          >
                            {ca.court.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {availability[0]?.slots.map((slot, idx) => (
                        <tr key={slot.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="p-2 text-sm font-medium text-gray-700 border-b whitespace-nowrap">
                            {formatTimeRange(slot.displayName)}
                          </td>
                          {availability.map((ca) => {
                            const courtSlot = ca.slots[idx]
                            const selected = isSlotSelected(ca.court.id, courtSlot.slotTime)
                            const slotRate = getSlotRate(courtSlot.slotTime)
                            return (
                              <td key={ca.court.id} className="p-2 text-center border-b">
                                <button
                                  onClick={() => toggleSlot(ca.court, courtSlot)}
                                  disabled={!courtSlot.available}
                                  className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                                    !courtSlot.available
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : selected
                                      ? sport === 'badminton'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-green-600 text-white'
                                      : sport === 'badminton'
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {!courtSlot.available
                                    ? 'Booked'
                                    : selected
                                    ? 'Selected'
                                    : 'Available'}
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
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Select time slots from the grid to start your booking
                </p>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Sport:</strong>{' '}
                      <span className={sport === 'badminton' ? 'text-blue-600' : 'text-green-600'}>
                        {sport === 'badminton' ? 'Badminton' : 'Pickleball'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Slots:</p>
                    {selectedSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
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
                      <span className="font-medium">Total:</span>
                      <span className="text-xl font-bold">RM{total.toFixed(2)}</span>
                    </div>

                    {/* Guest Booking Form */}
                    {!session && (
                      <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          Book as Guest
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="guestName" className="text-xs">Name *</Label>
                            <Input
                              id="guestName"
                              placeholder="Your name"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="guestPhone" className="text-xs">Phone *</Label>
                            <Input
                              id="guestPhone"
                              placeholder="012-345-6789"
                              value={guestPhone}
                              onChange={(e) => setGuestPhone(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="guestEmail" className="text-xs">Email (optional)</Label>
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

                    {/* Guest booking button (for non-logged-in users) */}
                    {!session && (
                      <Button
                        className={`w-full mb-2 ${sport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        size="lg"
                        onClick={handleGuestBooking}
                        disabled={booking}
                      >
                        {booking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          'Book Now (Pay at Counter)'
                        )}
                      </Button>
                    )}

                    {/* Logged-in user info */}
                    {session && !userIsAdmin && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Booking as: <strong>{session.user?.name}</strong>
                        </p>
                      </div>
                    )}

                    {/* Logged-in user booking button */}
                    {session && !userIsAdmin && (
                      <Button
                        className={`w-full mb-2 ${sport === 'pickleball' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        size="lg"
                        onClick={handleGuestBooking}
                        disabled={booking}
                      >
                        {booking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          'Book Now'
                        )}
                      </Button>
                    )}

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
                            Creating...
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

                  <p className="text-xs text-gray-500 text-center">
                    {!session
                      ? 'No account needed. Pay at the counter when you arrive.'
                      : userIsAdmin
                      ? 'Use "Test Book" to create bookings without payment'
                      : 'Your booking will be confirmed immediately'}
                  </p>
                </div>
              )}

              {/* Operating Hours - inside the sticky card */}
              <div className="mt-6 pt-4 border-t border-gray-200">
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
                    <User className="w-4 h-4 text-blue-600" />
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
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  )
}
