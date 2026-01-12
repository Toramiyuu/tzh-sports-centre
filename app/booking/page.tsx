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
import { CalendarDays, Clock, CreditCard, FlaskConical, Loader2, User } from 'lucide-react'
import { isAdmin } from '@/lib/admin'

// Pickleball flat rate
const PICKLEBALL_RATE = 25

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

export default function BookingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userIsAdmin = isAdmin(session?.user?.email)

  const [sport, setSport] = useState<Sport>('badminton')
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

  // Get hourly rate based on sport
  const getHourlyRate = (court: Court) => {
    return sport === 'pickleball' ? PICKLEBALL_RATE : court.hourlyRate
  }

  // Toggle slot selection
  const toggleSlot = (court: Court, slot: SlotAvailability) => {
    if (!slot.available) return
    setError('')
    setSuccess('')

    const existing = selectedSlots.find(
      (s) => s.courtId === court.id && s.slotTime === slot.slotTime
    )

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
          hourlyRate: getHourlyRate(court),
        },
      ])
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

  // Handle guest booking
  const handleGuestBooking = async () => {
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
              <span className="ml-2 text-xs text-gray-400">RM30-35/hr</span>
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
              <span className="ml-2 text-xs text-gray-400">RM25/hr</span>
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
                            <div className="text-xs text-gray-400 font-normal">
                              RM{getHourlyRate(ca.court)}/hr
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {availability[0]?.slots.map((slot, idx) => (
                        <tr key={slot.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="p-2 text-sm font-medium text-gray-700 border-b">
                            {slot.displayName}
                          </td>
                          {availability.map((ca) => {
                            const courtSlot = ca.slots[idx]
                            const selected = isSlotSelected(ca.court.id, courtSlot.slotTime)
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
                          <span className="text-sm">{slot.displayName}</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
