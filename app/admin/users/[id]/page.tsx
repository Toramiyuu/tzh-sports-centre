'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Repeat,
  User,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

interface UserData {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  isAdmin: boolean
  isSuperAdmin: boolean
  isMember: boolean
  skillLevel: string | null
  createdAt: string
}

interface BookingsSummary {
  thisWeek: number
  thisMonth: number
  thisYear: number
  total: number
  recurring: number
}

interface LessonsSummary {
  thisWeek: number
  thisMonth: number
  thisYear: number
  scheduled: number
  completed: number
  cancelled: number
  total: number
}

interface PaymentsSummary {
  currentMonth: {
    totalDue: number
    paid: number
    unpaid: number
    hours: number
  }
  allTime: {
    totalPaid: number
  }
}

interface BookingItem {
  id: string
  type: 'one-time'
  date: string
  time: string
  duration: number
  sport: string
  court: string
  amount: number
  status: string
}

interface RecurringBooking {
  id: string
  schedule: string
  time: string
  duration: number
  sport: string
  court: string
  label: string | null
  isActive: boolean
  startDate: string
  endDate: string | null
  amountPerSession: number
}

interface LessonItem {
  id: string
  date: string
  time: string
  duration: number
  type: string
  court: string
  price: number
  pricePerStudent: number
  status: string
  students: string[]
}

interface PaymentHistoryItem {
  id: string
  month: number
  year: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  status: string
  transactions: Array<{
    id: string
    amount: number
    method: string
    reference: string | null
    date: string
  }>
}

interface UserDetails {
  user: UserData
  bookingsSummary: BookingsSummary
  lessonsSummary: LessonsSummary
  paymentsSummary: PaymentsSummary
  bookingsTimeline: BookingItem[]
  recurringBookings: RecurringBooking[]
  lessonsTimeline: LessonItem[]
  paymentHistory: PaymentHistoryItem[]
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDetails | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email)) {
      router.push('/')
    }
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${resolvedParams.id}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        console.error('Failed to fetch user details')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && isAdmin(session.user.email) && resolvedParams.id) {
      fetchData()
    }
  }, [session, resolvedParams.id])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <Link href="/admin/accounts">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Accounts
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { user, bookingsSummary, lessonsSummary, paymentsSummary, bookingsTimeline, recurringBookings, lessonsTimeline, paymentHistory } = data
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/accounts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <Badge variant="outline" className="font-mono">#{user.uid}</Badge>
              {user.isSuperAdmin && <Badge className="bg-purple-600">Super Admin</Badge>}
              {user.isAdmin && !user.isSuperAdmin && <Badge className="bg-green-600">Admin</Badge>}
              {user.isMember && <Badge className="bg-blue-600">Member</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {user.phone}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/manage-payments?userId=${user.id}`}>
            <Button variant="outline" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payments
            </Button>
          </Link>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Bookings Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Bookings</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{bookingsSummary.total}</span>
                  <span className="text-xs text-gray-400">total</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {bookingsSummary.thisWeek} this week | {bookingsSummary.thisMonth} this month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recurring Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Repeat className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Recurring</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{bookingsSummary.recurring}</span>
                  <span className="text-xs text-gray-400">active</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {recurringBookings.filter(rb => !rb.isActive).length} inactive
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Lessons</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{lessonsSummary.completed}</span>
                  <span className="text-sm text-gray-400">/ {lessonsSummary.scheduled + lessonsSummary.completed}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {lessonsSummary.thisMonth} this month | {lessonsSummary.scheduled} scheduled
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                paymentsSummary.currentMonth.unpaid > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  paymentsSummary.currentMonth.unpaid > 0 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">This Month</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${
                    paymentsSummary.currentMonth.unpaid > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    RM{paymentsSummary.currentMonth.unpaid.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-400">unpaid</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  RM{paymentsSummary.currentMonth.paid.toFixed(0)} paid / RM{paymentsSummary.currentMonth.totalDue.toFixed(0)} due
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsTimeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {bookingsTimeline.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{format(new Date(booking.date), 'MMM d')}</span>
                            <Badge variant="outline" className="capitalize">{booking.sport}</Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.time} | {booking.court}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">RM{booking.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{booking.duration}hr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recurring Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Recurring Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recurringBookings.filter(rb => rb.isActive).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active recurring bookings</p>
                ) : (
                  <div className="space-y-3">
                    {recurringBookings.filter(rb => rb.isActive).map((rb) => (
                      <div key={rb.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{rb.schedule}</div>
                            <div className="text-sm text-gray-600">
                              {rb.time} | {rb.court}
                            </div>
                            {rb.label && (
                              <Badge variant="outline" className="mt-1">{rb.label}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">RM{rb.amountPerSession.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 capitalize">{rb.sport} | {rb.duration}hr</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Recent Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessonsTimeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No lessons yet</p>
                ) : (
                  <div className="space-y-3">
                    {lessonsTimeline.slice(0, 5).map((lesson) => (
                      <div key={lesson.id} className={`p-3 rounded-lg ${
                        lesson.status === 'completed' ? 'bg-green-50 border border-green-200' :
                        lesson.status === 'scheduled' ? 'bg-purple-50 border border-purple-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{format(new Date(lesson.date), 'MMM d')}</span>
                              <Badge variant="outline">{lesson.type.replace('-', ' ')}</Badge>
                              {lesson.status === 'completed' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {lesson.time} | {lesson.court}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">RM{lesson.pricePerStudent.toFixed(0)}</div>
                            <div className="text-xs text-gray-500">{lesson.duration}hr</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payment history</p>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.slice(0, 5).map((payment) => (
                      <div key={payment.id} className={`p-3 rounded-lg ${
                        payment.status === 'paid' ? 'bg-green-50' :
                        payment.status === 'partial' ? 'bg-yellow-50' :
                        'bg-red-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{monthNames[payment.month]} {payment.year}</span>
                              <Badge className={
                                payment.status === 'paid' ? 'bg-green-600' :
                                payment.status === 'partial' ? 'bg-yellow-600' :
                                'bg-red-600'
                              }>
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">RM{payment.paidAmount.toFixed(0)} / RM{payment.totalAmount.toFixed(0)}</div>
                            {payment.unpaidAmount > 0 && (
                              <div className="text-xs text-red-600">RM{payment.unpaidAmount.toFixed(0)} unpaid</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsTimeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Court</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Sport</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Duration</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsTimeline.map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{format(new Date(booking.date), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-3 text-gray-600">{booking.time}</td>
                          <td className="px-4 py-3">{booking.court}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">{booking.sport}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{booking.duration}hr</td>
                          <td className="px-4 py-3 text-right font-medium">RM{booking.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recurring bookings</p>
              ) : (
                <div className="space-y-4">
                  {recurringBookings.map((rb) => (
                    <div key={rb.id} className={`p-4 rounded-lg border ${
                      rb.isActive ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{rb.schedule}</span>
                            {rb.isActive ? (
                              <Badge className="bg-green-600">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                            {rb.label && <Badge variant="outline">{rb.label}</Badge>}
                          </div>
                          <div className="text-gray-600 mt-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {rb.time} ({rb.duration}hr)
                          </div>
                          <div className="text-gray-600">
                            {rb.court} | <span className="capitalize">{rb.sport}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            Started: {format(new Date(rb.startDate), 'MMM d, yyyy')}
                            {rb.endDate && ` | Ends: ${format(new Date(rb.endDate), 'MMM d, yyyy')}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">RM{rb.amountPerSession.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">per session</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader>
              <CardTitle>All Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {lessonsTimeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No lessons found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Court</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Duration</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonsTimeline.map((lesson) => (
                        <tr key={lesson.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">{format(new Date(lesson.date), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-3 text-gray-600">{lesson.time}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{lesson.type.replace('-', ' ')}</Badge>
                          </td>
                          <td className="px-4 py-3">{lesson.court}</td>
                          <td className="px-4 py-3 text-gray-600">{lesson.duration}hr</td>
                          <td className="px-4 py-3">
                            {lesson.status === 'completed' && (
                              <Badge className="bg-green-600">Completed</Badge>
                            )}
                            {lesson.status === 'scheduled' && (
                              <Badge className="bg-purple-600">Scheduled</Badge>
                            )}
                            {lesson.status === 'cancelled' && (
                              <Badge className="bg-red-600">Cancelled</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">RM{lesson.pricePerStudent.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payment history</p>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className={`p-4 rounded-lg border ${
                      payment.status === 'paid' ? 'bg-green-50 border-green-200' :
                      payment.status === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{monthNames[payment.month]} {payment.year}</span>
                            <Badge className={
                              payment.status === 'paid' ? 'bg-green-600' :
                              payment.status === 'partial' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                          {payment.transactions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {payment.transactions.map((t) => (
                                <div key={t.id} className="text-sm text-gray-600">
                                  {format(new Date(t.date), 'MMM d')} - RM{t.amount.toFixed(0)} via {t.method}
                                  {t.reference && <span className="text-gray-400"> ({t.reference})</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            RM{payment.paidAmount.toFixed(0)} / RM{payment.totalAmount.toFixed(0)}
                          </div>
                          {payment.unpaidAmount > 0 && (
                            <div className="text-red-600">RM{payment.unpaidAmount.toFixed(0)} unpaid</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
