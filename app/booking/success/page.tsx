'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Home,
  Receipt,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { celebrateBooking } from '@/lib/confetti'
import Link from 'next/link'

interface Booking {
  id: string
  court: { name: string }
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  paymentStatus: string
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  user: {
    name: string
    email: string
    phone: string
  } | null
}

interface PaymentData {
  status: string
  customerEmail: string
  amountTotal: number
  currency: string
  bookings: Booking[]
  metadata: {
    customerName: string
    customerPhone: string
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setError('No session ID provided')
      setLoading(false)
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/payments/verify?session_id=${sessionId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to verify payment')
          return
        }

        setPaymentData(data)

        // Celebrate successful payment!
        if (data.status === 'paid') {
          celebrateBooking()
        }
      } catch (_err) {
        setError('Failed to verify payment')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-900 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to verify payment'}</p>
            <Button onClick={() => router.push('/booking')}>
              Return to Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid = paymentData.status === 'paid'
  const customerName = paymentData.bookings[0]?.user?.name ||
    paymentData.bookings[0]?.guestName ||
    paymentData.metadata?.customerName ||
    'Guest'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPaid ? 'Payment Successful!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-600">
            Thank you, {customerName}! Your court booking has been confirmed.
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Badge className="bg-green-100 text-green-700">
                {isPaid ? 'Paid' : 'Confirmed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentData.bookings.map((booking, index) => (
              <div
                key={booking.id}
                className={`p-4 rounded-lg ${
                  booking.sport === 'badminton'
                    ? 'bg-neutral-50 border border-neutral-200'
                    : 'bg-green-50 border border-green-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{booking.court.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          booking.sport === 'badminton'
                            ? 'bg-neutral-100 text-neutral-700 border-0'
                            : 'bg-green-100 text-green-700 border-0'
                        }
                      >
                        {booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">RM {booking.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-medium text-gray-700">Total Paid</span>
              <span className="text-2xl font-bold text-green-600">
                RM {paymentData.amountTotal.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/booking">
              <Calendar className="w-4 h-4 mr-2" />
              Book Another Court
            </Link>
          </Button>
          {paymentData.bookings[0] && (
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/booking/receipt?bookingId=${paymentData.bookings[0].id}`}>
                <Receipt className="w-4 h-4 mr-2" />
                View Receipt
              </Link>
            </Button>
          )}
        </div>

        {/* Reminder */}
        <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-2">Important Reminders</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            <li>Please arrive 10 minutes before your booking time</li>
            <li>Bring your own rackets and shuttlecocks</li>
            <li>Contact us at <a href="tel:+60116868508" className="underline">011-6868 8508</a> for any changes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-900" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
