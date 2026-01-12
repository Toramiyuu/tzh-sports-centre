'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Court {
  id: number
  name: string
}

interface Booking {
  id: string
  courtId: number
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  createdAt: string
  court: Court
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchBookings() {
      if (!session) return

      try {
        const res = await fetch('/api/bookings')
        const data = await res.json()
        setBookings(data.bookings || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchBookings()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Separate bookings into upcoming and past
  const now = new Date()
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.bookingDate) >= new Date(now.toDateString())
  )
  const pastBookings = bookings.filter(
    (b) => new Date(b.bookingDate) < new Date(now.toDateString())
  )

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

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{booking.court.name}</span>
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
        <p className="text-xs text-gray-500">
          Booked {format(new Date(booking.createdAt), 'MMM d')}
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">
          Welcome back, {session.user?.name}! Here are your court bookings.
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t made any court bookings. Book your first session now!
            </p>
            <Link href="/booking">
              <Button>Book a Court</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Upcoming Bookings ({upcomingBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No upcoming bookings</p>
                  <Link href="/booking" className="text-blue-600 hover:underline text-sm">
                    Book a court
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
