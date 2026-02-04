'use client'

import { useState, useEffect } from 'react'
import { format, differenceInHours, parseISO } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Clock,
  Loader2,
  History,
  AlertTriangle,
  X,
  CreditCard,
  RefreshCw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Booking {
  id: string
  court: { name: string }
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  createdAt: string
}

interface BookingsTabProps {
  creditBalance: number
  onCreditUpdate: () => void
}

export function BookingsTab({ creditBalance, onCreditUpdate }: BookingsTabProps) {
  const [activeView, setActiveView] = useState<'upcoming' | 'past'>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setError('')
      const res = await fetch('/api/profile/bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      } else {
        setError('Failed to load bookings')
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const canCancel = (booking: Booking) => {
    const bookingDateTime = new Date(`${booking.bookingDate.split('T')[0]}T${booking.startTime}`)
    const hoursUntilBooking = differenceInHours(bookingDateTime, new Date())
    return hoursUntilBooking >= 24 && booking.status === 'confirmed'
  }

  const handleCancel = async (bookingId: string) => {
    setCancelDialogId(null)
    setCancellingId(bookingId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/profile/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to cancel booking')
        return
      }

      setSuccess(`Booking cancelled. RM${data.creditAdded.toFixed(2)} added to your credit balance.`)
      fetchBookings()
      onCreditUpdate()
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setCancellingId(null)
    }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const upcomingBookings = bookings
    .filter((b) => new Date(b.bookingDate) >= today && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime())

  const pastBookings = bookings
    .filter((b) => new Date(b.bookingDate) < today || b.status === 'cancelled')
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())

  const displayedBookings = activeView === 'upcoming' ? upcomingBookings : pastBookings

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Credit Balance Display */}
      {creditBalance > 0 && (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-neutral-600" />
          <div>
            <p className="font-medium text-neutral-900">Credit Balance: RM{creditBalance.toFixed(2)}</p>
            <p className="text-sm text-neutral-500">Available to use on your next booking</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => { setError(''); setLoading(true); fetchBookings() }}
            className="flex items-center gap-1 text-red-700 hover:text-red-800 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
            activeView === 'upcoming'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Upcoming
          {upcomingBookings.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeView === 'upcoming' ? 'bg-white/20' : 'bg-neutral-300'
            }`}>
              {upcomingBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('past')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
            activeView === 'past'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <History className="w-4 h-4" />
          Past
          {pastBookings.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeView === 'past' ? 'bg-white/20' : 'bg-neutral-300'
            }`}>
              {pastBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Bookings List */}
      {displayedBookings.length === 0 ? (
        <Card className="border border-neutral-200 rounded-2xl">
          <CardContent className="py-12 text-center">
            {activeView === 'upcoming' ? (
              <>
                <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No upcoming bookings</h3>
                <p className="text-neutral-500">You don&apos;t have any upcoming court bookings.</p>
              </>
            ) : (
              <>
                <History className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No past bookings</h3>
                <p className="text-neutral-500">You don&apos;t have any past court bookings.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-neutral-200 rounded-2xl">
          <CardContent className="p-4">
            <div className="space-y-3">
              {displayedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`flex items-center justify-between p-4 bg-neutral-50 rounded-xl ${
                    booking.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">{booking.court.name}</span>
                      <Badge className={
                        booking.sport === 'badminton'
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-neutral-200 text-neutral-700'
                      }>
                        {booking.sport === 'badminton' ? 'Badminton' : 'Pickleball'}
                      </Badge>
                      <Badge className={
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
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
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-neutral-900">RM{booking.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-neutral-400">
                        Booked {format(new Date(booking.createdAt), 'MMM d')}
                      </p>
                    </div>
                    {activeView === 'upcoming' && canCancel(booking) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                        onClick={() => setCancelDialogId(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                    {activeView === 'upcoming' && !canCancel(booking) && booking.status === 'confirmed' && (
                      <span className="text-xs text-neutral-400">
                        Cannot cancel within 24hrs
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialogId} onOpenChange={(open) => { if (!open) setCancelDialogId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Cancel Booking</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Are you sure you want to cancel this booking? The amount will be added to your credit balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogId(null)} className="rounded-full">
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelDialogId && handleCancel(cancelDialogId)}
              className="rounded-full"
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
