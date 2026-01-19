'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isAdmin } from '@/lib/admin'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface StringingOrder {
  id: string
  stringName: string
  price: number
  customerName: string
  customerPhone: string
  customerEmail: string | null
  racketModel: string
  racketModelCustom: string | null
  tensionMain: number
  tensionCross: number
  pickupDate: string
  notes: string | null
  paymentMethod: string | null
  paymentUserConfirmed: boolean
  paymentStatus: string
  markedPaidBy: string | null
  markedPaidAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string
  } | null
}

interface Stats {
  totalOrders: number
  pendingOrders: number
  paidOrders: number
}

export default function AdminStringingPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const t = useTranslations('stringing')
  const tAdmin = useTranslations('admin')

  const [orders, setOrders] = useState<StringingOrder[]>([])
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, paidOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  const userIsAdmin = isAdmin(session?.user?.email)

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (!session?.user?.email || !userIsAdmin) {
      router.push('/admin')
      return
    }

    fetchOrders()
  }, [session, sessionStatus, userIsAdmin, router, statusFilter, timeFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/stringing?status=${statusFilter}&time=${timeFilter}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setStats(data.stats || { totalOrders: 0, pendingOrders: 0, paidOrders: 0 })
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (orderId: string) => {
    try {
      setMarkingPaid(orderId)
      const res = await fetch('/api/admin/stringing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'markPaid' }),
      })

      if (!res.ok) throw new Error('Failed to update order')

      toast.success(t('admin.markPaidSuccess'))
      fetchOrders()
    } catch (error) {
      console.error('Error marking order as paid:', error)
      toast.error('Failed to update order')
    } finally {
      setMarkingPaid(null)
    }
  }

  const getStatusBadge = (order: StringingOrder) => {
    if (order.paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-700">{t('status.paid')}</Badge>
    }
    if (order.paymentUserConfirmed) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          {t('admin.paymentConfirmed')}
        </Badge>
      )
    }
    return <Badge className="bg-gray-100 text-gray-700">{t('status.pending')}</Badge>
  }

  const formatWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const formatted = cleaned.startsWith('0') ? '6' + cleaned : cleaned
    return `https://wa.me/${formatted}`
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {tAdmin('back')}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
                <p className="text-sm text-gray-500">{t('admin.description')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/stringing/stock">
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  Stock
                </Button>
              </Link>
              <Button variant="outline" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {tAdmin('refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('admin.totalOrders')}</p>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <Package className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('admin.pendingPayments')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('admin.completedOrders')}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.paidOrders}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">{t('admin.allOrders')}</TabsTrigger>
              <TabsTrigger value="pending">{t('admin.pendingOrders')}</TabsTrigger>
              <TabsTrigger value="paid">{t('admin.paidOrders')}</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('admin.timeFilter.allTime')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.timeFilter.allTime')}</SelectItem>
                  <SelectItem value="today">{t('admin.timeFilter.today')}</SelectItem>
                  <SelectItem value="week">{t('admin.timeFilter.thisWeek')}</SelectItem>
                  <SelectItem value="month">{t('admin.timeFilter.thisMonth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={statusFilter}>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">{t('admin.noOrders')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Order Info */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{order.customerName}</h3>
                            {getStatusBadge(order)}
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            {/* Contact */}
                            <div>
                              <p className="text-gray-500">{t('admin.customer')}</p>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{order.customerPhone}</span>
                              </div>
                              {order.customerEmail && (
                                <p className="text-gray-600">{order.customerEmail}</p>
                              )}
                            </div>

                            {/* String */}
                            <div>
                              <p className="text-gray-500">{t('admin.string')}</p>
                              <p className="font-medium">{order.stringName}</p>
                              <p className="text-blue-600 font-semibold">RM{order.price}</p>
                            </div>

                            {/* Racket */}
                            <div>
                              <p className="text-gray-500">{t('admin.racket')}</p>
                              <p className="font-medium">{order.racketModel}</p>
                            </div>

                            {/* Tension */}
                            <div>
                              <p className="text-gray-500">{t('admin.tension')}</p>
                              <p className="font-medium">
                                {order.tensionMain} / {order.tensionCross} lbs
                              </p>
                            </div>

                            {/* Pickup */}
                            <div>
                              <p className="text-gray-500">{t('admin.pickup')}</p>
                              <p className="font-medium">
                                {format(new Date(order.pickupDate), 'PPP')}
                              </p>
                            </div>

                            {/* Created */}
                            <div>
                              <p className="text-gray-500">{t('admin.createdAt')}</p>
                              <p className="font-medium">
                                {format(new Date(order.createdAt), 'PPp')}
                              </p>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">{order.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 lg:w-40">
                          {order.paymentStatus !== 'paid' && (
                            <Button
                              onClick={() => handleMarkPaid(order.id)}
                              disabled={markingPaid === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {markingPaid === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                              )}
                              {t('admin.markPaid')}
                            </Button>
                          )}
                          <a
                            href={formatWhatsAppLink(order.customerPhone)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="w-full">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              {t('admin.whatsapp')}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
