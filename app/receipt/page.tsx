'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, CalendarDays, Clock, Loader2, Receipt } from 'lucide-react'

interface Booking {
  id: string
  court: string
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  name: string
  phone: string
  createdAt: string
}

export default function ReceiptPage() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')
    setSearched(false)

    try {
      const res = await fetch(`/api/receipt?phone=${encodeURIComponent(phone.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch bookings')
        return
      }

      setBookings(data.bookings || [])
      setSearched(true)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSportBadge = (sport: string) => {
    return sport === 'badminton' ? (
      <Badge className="bg-blue-100 text-blue-700">Badminton</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-700">Pickleball</Badge>
    )
  }

  // Separate bookings into upcoming and past
  const now = new Date()
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.bookingDate) >= new Date(now.toDateString())
  )
  const pastBookings = bookings.filter(
    (b) => new Date(b.bookingDate) < new Date(now.toDateString())
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Bookings</h1>
        <p className="text-gray-600">
          Enter your phone number to look up your court bookings
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search by Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="phone" className="sr-only">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number (e.g., 012-345-6789)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <>
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  We couldn&apos;t find any bookings associated with this phone number.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Upcoming Bookings ({upcomingBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{booking.court}</span>
                              {getSportBadge(booking.sport)}
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {format(new Date(booking.bookingDate), 'EEE, MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Booked by: {booking.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">RM{booking.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              Booked {format(new Date(booking.createdAt), 'MMM d')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5" />
                      Past Bookings ({pastBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 opacity-75">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{booking.court}</span>
                              {getSportBadge(booking.sport)}
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {format(new Date(booking.bookingDate), 'EEE, MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">RM{booking.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
