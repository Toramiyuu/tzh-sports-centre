'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Phone,
  User,
  Check,
  Receipt,
  Calendar,
  DollarSign,
  Clock,
  RefreshCw,
  FileText,
  Banknote,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface Court {
  id: number
  name: string
  hourlyRate: number
}

interface RecurringBookingPayment {
  id: string
  month: number
  year: number
  amount: number
  sessionsCount: number
  status: string
  paidAt: string | null
  paymentMethod: string | null
  notes: string | null
}

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
  hourlyRate: number | null
  guestName: string | null
  guestPhone: string | null
  userId: string | null
  isActive: boolean
  court: Court
  user: { name: string; phone: string; uid: bigint } | null
  payments: RecurringBookingPayment[]
}

export default function RecurringPaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [recurringBookings, setRecurringBookings] = useState<RecurringBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<RecurringBooking | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Generate invoice dialog
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [bookingToGenerate, setBookingToGenerate] = useState<RecurringBooking | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email)) {
      router.push('/')
    }
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/recurring-payments?month=${selectedMonth}&year=${selectedYear}`)
      const data = await res.json()

      if (res.ok) {
        // Fetch payments for each booking for the selected month
        const bookingsWithPayments = await Promise.all(
          (data.recurringBookings || []).map(async (booking: RecurringBooking) => {
            const paymentRes = await fetch(
              `/api/admin/recurring-payments?recurringBookingId=${booking.id}`
            )
            const paymentData = await paymentRes.json()
            const payments = paymentData.payments || []
            const currentMonthPayment = payments.find(
              (p: RecurringBookingPayment) => p.month === selectedMonth && p.year === selectedYear
            )
            return {
              ...booking,
              payments: currentMonthPayment ? [currentMonthPayment] : [],
            }
          })
        )
        setRecurringBookings(bookingsWithPayments)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && isAdmin(session.user.email)) {
      fetchData()
    }
  }, [session, selectedMonth, selectedYear])

  // Calculate hours from time range
  const calculateHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return (endMinutes - startMinutes) / 60
  }

  // Count sessions in a month for a given day of week
  const countSessionsInMonth = (year: number, month: number, dayOfWeek: number): number => {
    let count = 0
    const date = new Date(year, month - 1, 1)
    while (date.getMonth() === month - 1) {
      if (date.getDay() === dayOfWeek) count++
      date.setDate(date.getDate() + 1)
    }
    return count
  }

  // Calculate monthly amount for a booking
  const calculateMonthlyAmount = (booking: RecurringBooking): number => {
    const sessions = countSessionsInMonth(selectedYear, selectedMonth, booking.dayOfWeek)
    const hours = calculateHours(booking.startTime, booking.endTime)
    const rate = booking.hourlyRate || booking.court.hourlyRate
    return sessions * hours * rate
  }

  // Generate invoice for a booking
  const handleGenerateInvoice = async () => {
    if (!bookingToGenerate) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/recurring-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringBookingId: bookingToGenerate.id,
          month: selectedMonth,
          year: selectedYear,
        }),
      })

      if (res.ok) {
        setGenerateDialogOpen(false)
        setBookingToGenerate(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Mark payment as paid
  const handleMarkAsPaid = async () => {
    if (!selectedBooking || selectedBooking.payments.length === 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/recurring-payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedBooking.payments[0].id,
          status: 'paid',
          paymentMethod,
          notes: paymentNotes || null,
        }),
      })

      if (res.ok) {
        setPaymentDialogOpen(false)
        setSelectedBooking(null)
        setPaymentMethod('cash')
        setPaymentNotes('')
        fetchData()
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Navigate months
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  // Get payment status for a booking
  const getPaymentStatus = (booking: RecurringBooking) => {
    if (booking.payments.length === 0) return 'no-invoice'
    return booking.payments[0].status
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Summary stats
  const totalBookings = recurringBookings.length
  const paidCount = recurringBookings.filter(b => getPaymentStatus(b) === 'paid').length
  const pendingCount = recurringBookings.filter(b => getPaymentStatus(b) === 'pending').length
  const noInvoiceCount = recurringBookings.filter(b => getPaymentStatus(b) === 'no-invoice').length
  const totalExpected = recurringBookings.reduce((sum, b) => sum + calculateMonthlyAmount(b), 0)
  const totalPaid = recurringBookings
    .filter(b => getPaymentStatus(b) === 'paid')
    .reduce((sum, b) => sum + (b.payments[0]?.amount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Payments</h1>
          <p className="text-gray-600">Manage monthly invoices for recurring bookings</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Month Navigator */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-xl font-bold">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-xl font-bold text-green-600">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Collected</p>
                <p className="text-xl font-bold">RM{totalPaid.toFixed(0)}<span className="text-sm text-gray-400">/{totalExpected.toFixed(0)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {MONTHS[selectedMonth - 1]} {selectedYear} Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : recurringBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No recurring bookings found
            </div>
          ) : (
            <div className="space-y-3">
              {recurringBookings.map((booking) => {
                const paymentStatus = getPaymentStatus(booking)
                const monthlyAmount = calculateMonthlyAmount(booking)
                const sessions = countSessionsInMonth(selectedYear, selectedMonth, booking.dayOfWeek)
                const hours = calculateHours(booking.startTime, booking.endTime)

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-lg border ${
                      paymentStatus === 'paid'
                        ? 'bg-green-50 border-green-200'
                        : paymentStatus === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {booking.label || booking.user?.name || booking.guestName || 'Unknown'}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              booking.sport === 'badminton'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }
                          >
                            {booking.sport}
                          </Badge>
                          {paymentStatus === 'paid' && (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              <CreditCard className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          )}
                          {paymentStatus === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-0">
                              <Banknote className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {paymentStatus === 'no-invoice' && (
                            <Badge variant="outline" className="text-gray-500">
                              No Invoice
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {DAYS_OF_WEEK[booking.dayOfWeek]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.startTime} - {booking.endTime}
                            </span>
                            <span>{booking.court.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {(booking.user || booking.guestPhone) && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {booking.user?.phone || booking.guestPhone}
                              </span>
                            )}
                            {booking.user && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                UID: {booking.user.uid.toString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">
                            {sessions} sessions × {hours}hr × RM{(booking.hourlyRate || booking.court.hourlyRate).toFixed(0)} =
                          </span>
                          <span className="font-bold text-gray-900 ml-1">
                            RM{monthlyAmount.toFixed(2)}
                          </span>
                        </div>

                        {paymentStatus === 'paid' && booking.payments[0] && (
                          <div className="mt-2 text-xs text-green-600">
                            Paid on {format(new Date(booking.payments[0].paidAt!), 'dd MMM yyyy')}
                            {booking.payments[0].paymentMethod && ` via ${booking.payments[0].paymentMethod.toUpperCase()}`}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {paymentStatus === 'no-invoice' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBookingToGenerate(booking)
                              setGenerateDialogOpen(true)
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Generate Invoice
                          </Button>
                        )}
                        {paymentStatus === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setPaymentDialogOpen(true)
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for {MONTHS[selectedMonth - 1]} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          {bookingToGenerate && (
            <div className="py-4 space-y-3">
              <p><strong>Booking:</strong> {bookingToGenerate.label || bookingToGenerate.user?.name || bookingToGenerate.guestName}</p>
              <p><strong>Schedule:</strong> Every {DAYS_OF_WEEK[bookingToGenerate.dayOfWeek]}, {bookingToGenerate.startTime} - {bookingToGenerate.endTime}</p>
              <p><strong>Court:</strong> {bookingToGenerate.court.name}</p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Sessions this month:</strong> {countSessionsInMonth(selectedYear, selectedMonth, bookingToGenerate.dayOfWeek)}
                </p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  Total: RM{calculateMonthlyAmount(bookingToGenerate).toFixed(2)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CreditCard className="w-5 h-5" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Mark this invoice as paid
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && selectedBooking.payments[0] && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p><strong>Booking:</strong> {selectedBooking.label || selectedBooking.user?.name || selectedBooking.guestName}</p>
                <p><strong>Amount:</strong> RM{selectedBooking.payments[0].amount.toFixed(2)}</p>
                <p><strong>Sessions:</strong> {selectedBooking.payments[0].sessionsCount}</p>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="tng">Touch &apos;n Go</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any notes about this payment"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentDialogOpen(false)
              setSelectedBooking(null)
              setPaymentMethod('cash')
              setPaymentNotes('')
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
