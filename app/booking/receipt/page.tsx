'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Printer,
  ArrowLeft,
  CheckCircle,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface BookingReceipt {
  id: string
  court: string
  sport: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  paymentStatus: string
  name: string
  email: string
  phone: string
  createdAt: string
  stripeSessionId: string | null
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingReceipt[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      setError('No booking ID provided')
      setLoading(false)
      return
    }

    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/receipt?bookingId=${bookingId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to fetch receipt')
          return
        }

        setBookings(data.bookings || [])
      } catch (_err) {
        setError('Failed to fetch receipt')
      } finally {
        setLoading(false)
      }
    }

    fetchReceipt()
  }, [searchParams])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to load receipt'}</p>
            <Button asChild>
              <Link href="/booking">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Booking
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const firstBooking = bookings[0]
  const totalAmount = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const isPaid = firstBooking.paymentStatus === 'paid'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with actions - hide when printing */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" asChild>
            <Link href="/booking">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>

        {/* Receipt Card */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto">
                TZH
              </div>
            </div>
            <CardTitle className="text-2xl">TZH Sports Centre</CardTitle>
            <p className="text-gray-500 text-sm">Booking Receipt</p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <Badge className={isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                <CheckCircle className="w-3 h-3 mr-1" />
                {isPaid ? 'Payment Confirmed' : 'Pending Payment'}
              </Badge>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Customer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{firstBooking.name}</span>
                </div>
                {firstBooking.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{firstBooking.email}</span>
                  </div>
                )}
                {firstBooking.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{firstBooking.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium text-gray-700">Booking Details</h3>
              {bookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`p-4 rounded-lg border ${
                    booking.sport === 'badminton'
                      ? 'bg-neutral-50 border-neutral-200'
                      : 'bg-green-50 border-green-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{booking.court}</span>
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
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">RM {booking.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-green-600">RM {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>Receipt ID: {firstBooking.stripeSessionId?.slice(-12) || firstBooking.id.slice(-12)}</p>
              <p className="mt-1">
                Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}
              </p>
              <p className="mt-4">Thank you for booking with TZH Sports Centre!</p>
              <p className="text-xs mt-2">Contact: <a href="tel:+60116868508">011-6868 8508</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-900" />
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  )
}
