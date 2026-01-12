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
import { CalendarDays, Clock, CreditCard, FlaskConical, Loader2, User, Repeat } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { isAdmin } from '@/lib/admin'

// Hourly rates
const BADMINTON_RATE = 15
const BADMINTON_PEAK_RATE = 18 // 6 PM onwards
const BADMINTON_PEAK_START = '18:00' // 6 PM
const PICKLEBALL_RATE = 25
const PICKLEBALL_MIN_HOURS = 2

// Format time slot to show range (e.g., "9:00 AM" -> "9:00 - 10:00 AM")
const formatTimeRange = (displayName: string): string => {
  // Parse the time (e.g., "9:00 AM" or "12:00 PM")
  const match = displayName.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return displayName

  let hour = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()

  // Calculate end hour
  let endHour = hour + 1
  let endPeriod = period

  if (hour === 11 && period === 'AM') {
    endPeriod = 'PM'
  } else if (hour === 11 && period === 'PM') {
    endPeriod = 'AM' // midnight
  } else if (hour === 12) {
    endHour = 1
  }

  return `${hour}:${minutes} - ${endHour}:${minutes} ${endPeriod}`
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
  hourlyRate: number
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
  const [makeRecurring, setMakeRecurring] = useState(false)

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

  // Get hourly rate based on sport and time slot
  // Badminton: 15 RM normally, 18 RM from 6 PM onwards
  // Pickleball: 25 RM always
  const getHourlyRate = (slotTime?: string) => {
    if (sport === 'pickleball') return PICKLEBALL_RATE
    // Badminton: check if peak hours (6 PM onwards)
    if (slotTime && slotTime >= BADMINTON_PEAK_START) {
      return BADMINTON_PEAK_RATE
    }
    return BADMINTON_RATE
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

  // Check if a slot is part of a pickleball pair (the second hour of a 2-hour booking)
  const isSecondHourOfPickleballPair = (courtId: number, slotTime: string): boolean => {
    if (sport !== 'pickleball') return false

    const courtAvailability = availability.find(ca => ca.court.id === courtId)
    if (!courtAvailability) return false

    const currentIndex = courtAvailability.slots.findIndex(s => s.slotTime === slotTime)
    if (currentIndex <= 0) return false

    const previousSlot = courtAvailability.slots[currentIndex - 1]
    return isSlotSelected(courtId, previousSlot.slotTime)
  }

  // Toggle slot selection
  const toggleSlot = (court: Court, slot: SlotAvailability) => {
    if (!slot.available) return
    setError('')
    setSuccess('')

    const existing = selectedSlots.find(
      (s) => s.courtId === court.id && s.slotTime === slot.slotTime
    )

    if (sport === 'pickleball') {
      // For pickleball, handle 2-hour consecutive booking
      if (existing) {
        // Check if this is the first hour of a pair - remove both slots
        const nextSlot = getNextSlot(court, slot.slotTime)
        if (nextSlot && isSlotSelected(court.id, nextSlot.slotTime)) {
          // This is the first hour, remove both
          setSelectedSlots(selectedSlots.filter(
            (s) => !(s.courtId === court.id && (s.slotTime === slot.slotTime || s.slotTime === nextSlot.slotTime))
          ))
        } else {
          // This is the second hour, remove both (find the first hour)
          const prevSlot = getPreviousSlot(court, slot.slotTime)
          if (prevSlot && isSlotSelected(court.id, prevSlot.slotTime)) {
            setSelectedSlots(selectedSlots.filter(
              (s) => !(s.courtId === court.id && (s.slotTime === slot.slotTime || s.slotTime === prevSlot.slotTime))
            ))
          } else {
            // Single slot somehow, just remove it
            setSelectedSlots(selectedSlots.filter((s) => s !== existing))
          }
        }
      } else {
        // Adding new pickleball slots - need 2 consecutive hours
        const nextSlot = getNextSlot(court, slot.slotTime)

        if (!nextSlot) {
          setError('Pickleball requires 2 consecutive hours. This is the last time slot.')
          return
        }

        if (!nextSlot.available) {
          setError('Pickleball requires 2 consecutive hours. The next hour is not available.')
          return
        }

        // Check if next slot is already selected (part of another pair)
        if (isSlotSelected(court.id, nextSlot.slotTime)) {
          setError('The next hour is already part of another booking.')
          return
        }

        // Add both slots
        setSelectedSlots([
          ...selectedSlots,
          {
            courtId: court.id,
            courtName: court.name,
            slotTime: slot.slotTime,
            displayName: slot.displayName,
            hourlyRate: getHourlyRate(slot.slotTime),
          },
          {
            courtId: court.id,
            courtName: court.name,
            slotTime: nextSlot.slotTime,
            displayName: nextSlot.displayName,
            hourlyRate: getHourlyRate(nextSlot.slotTime),
          },
        ])
      }
    } else {
      // Badminton - single hour selection
      if (existing) {
        setSelectedSlots(selectedSlots.filter((s) => s !== existing))
      } else {
        setSelectedSlots([
          ...selectedSlots,
          {
            courtId: court.id,
            courtName: court.name,
            slotTime: slot.slotTime,
            displayName: slot.displayName,
            hourlyRate: getHourlyRate(slot.slotTime),
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

  // Calculate total
  const total = selectedSlots.reduce((sum, slot) => sum + slot.hourlyRate, 0)

  // Check if pickleball minimum hours requirement is met
  const validatePickleballMinimum = () => {
    if (sport === 'pickleball' && selectedSlots.length < PICKLEBALL_MIN_HOURS) {
      setError(`Pickleball requires a minimum of ${PICKLEBALL_MIN_HOURS} hours booking`)
      return false
    }
    return true
  }

  // Handle guest booking
  const handleGuestBooking = async () => {
    if (!validatePickleballMinimum()) return

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
            hourlyRate: s.hourlyRate,
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

      // If recurring is selected, also create recurring booking(s)
      if (makeRecurring && selectedSlots.length > 0) {
        const dayOfWeek = selectedDate.getDay()
        // Group slots by court
        const slotsByCourtMap = selectedSlots.reduce((acc, slot) => {
          if (!acc[slot.courtId]) {
            acc[slot.courtId] = []
          }
          acc[slot.courtId].push(slot)
          return acc
        }, {} as Record<number, typeof selectedSlots>)

        // Create recurring booking for each court
        for (const [courtId, slots] of Object.entries(slotsByCourtMap)) {
          const sortedSlots = slots.sort((a, b) => a.slotTime.localeCompare(b.slotTime))
          await fetch('/api/recurring-bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courtId: parseInt(courtId),
              sport,
              dayOfWeek,
              startTime: sortedSlots[0].slotTime,
              startDate: selectedDate.toISOString(),
              guestName: guestName.trim(),
              guestPhone: guestPhone.trim(),
              isAdminBooking: false,
              consecutiveHours: sortedSlots.length,
            }),
          })
        }
      }

      const recurringMsg = makeRecurring ? ' This will repeat weekly.' : ''
      setSuccess(`Booking confirmed! ${data.count} slot(s) booked.${recurringMsg} Please pay at counter.`)
      setSelectedSlots([])
      setGuestName('')
      setGuestPhone('')
      setGuestEmail('')
      setMakeRecurring(false)
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
    if (!validatePickleballMinimum()) return

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
            hourlyRate: s.hourlyRate,
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
              <span className="ml-2 text-xs text-gray-400">RM15/hr (RM18 after 6PM)</span>
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
              <span className="ml-2 text-xs text-gray-400">RM25/hr (2hr min)</span>
            </button>
          </nav>
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
                            const slotRate = getHourlyRate(courtSlot.slotTime)
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
                                    : `RM${slotRate}`}
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
                          RM{slot.hourlyRate}
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
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="makeRecurring"
                              checked={makeRecurring}
                              onCheckedChange={(checked) => setMakeRecurring(checked as boolean)}
                            />
                            <label
                              htmlFor="makeRecurring"
                              className="text-xs font-medium leading-none flex items-center gap-1 cursor-pointer"
                            >
                              <Repeat className="w-3 h-3" />
                              Make this a weekly recurring booking
                            </label>
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
