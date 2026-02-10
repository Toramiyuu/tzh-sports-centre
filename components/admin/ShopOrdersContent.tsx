'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Search,
  Package,
  Eye,
  CheckCircle2,
  Clock,
  CreditCard,
  Truck,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface OrderItem {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  selectedSize?: string | null
  selectedColor?: string | null
}

interface ShopOrder {
  id: string
  userId: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  items: OrderItem[]
  total: number
  status: string
  paymentMethod: string | null
  paymentStatus: string
  receiptUrl: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_OPTIONS = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
]

const STATUS_ICONS: Record<string, typeof Package> = {
  PENDING_PAYMENT: CreditCard,
  CONFIRMED: CheckCircle2,
  PREPARING: Package,
  READY_FOR_PICKUP: Truck,
  COMPLETED: Check,
  CANCELLED: X,
}

export default function ShopOrdersContent() {
  const { data: session } = useSession()
  const t = useTranslations('admin.shopOrders')

  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) return

    setLoading(true)
    try {
      const res = await fetch('/api/shop/orders?all=true')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch {
      toast.error(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }, [session, t])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        const updated = await res.json()
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...updated })
        }
        toast.success(t('statusUpdated'))
      } else {
        toast.error(t('updateFailed'))
      }
    } catch {
      toast.error(t('updateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const verifyPayment = async (orderId: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'verified', status: 'CONFIRMED' }),
      })

      if (res.ok) {
        const updated = await res.json()
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o))
        )
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...updated })
        }
        toast.success(t('paymentVerified'))
      } else {
        toast.error(t('updateFailed'))
      }
    } catch {
      toast.error(t('updateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: orders.length,
    PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    READY_FOR_PICKUP: orders.filter((o) => o.status === 'READY_FOR_PICKUP').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      case 'READY_FOR_PICKUP': return 'bg-blue-100 text-blue-700'
      case 'PREPARING': return 'bg-yellow-100 text-yellow-700'
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700'
      case 'PENDING_PAYMENT': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending_verification': return 'bg-yellow-100 text-yellow-700'
      case 'pending': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t('pendingPayment')}</p>
          <p className="text-2xl font-bold text-orange-600">{statusCounts.PENDING_PAYMENT}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t('processing')}</p>
          <p className="text-2xl font-bold text-blue-600">
            {statusCounts.CONFIRMED + statusCounts.PREPARING}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{t('completed')}</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.COMPLETED}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('allStatuses')} ({statusCounts.all})
            </SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)} ({statusCounts[s as keyof typeof statusCounts]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('orderId')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('customer')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('items')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('totalLabel')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('statusLabel')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('payment')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('date')}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const items = order.items as OrderItem[]
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{order.id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{items.length} {items.length === 1 ? t('item') : t('itemPlural')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold">RM{order.total.toFixed(0)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn('text-xs', getStatusColor(order.status))}>
                          {t(`status.${order.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn('text-xs', getPaymentStatusColor(order.paymentStatus))}>
                          {t(`paymentStatus.${order.paymentStatus}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'dd/MM/yy HH:mm')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setDetailsOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.paymentStatus === 'pending_verification' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => verifyPayment(order.id)}
                              disabled={updating}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('orderDetails')}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orderId')}</span>
                  <span className="font-mono">{selectedOrder.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customer')}</span>
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('phone')}</span>
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                {selectedOrder.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('email')}</span>
                    <span>{selectedOrder.customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('date')}</span>
                  <span>{format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('paymentMethod')}</span>
                  <span className="capitalize">{selectedOrder.paymentMethod || '-'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">{t('items')}</h4>
                <div className="space-y-2">
                  {(selectedOrder.items as OrderItem[]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        <Image
                          src={item.image || '/images/shop/placeholder.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/images/shop/placeholder.jpg'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm">x{item.quantity}</p>
                        <p className="text-xs text-muted-foreground">RM{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-semibold">{t('totalLabel')}</span>
                  <span className="text-lg font-bold">RM{selectedOrder.total.toFixed(0)}</span>
                </div>
              </div>

              {/* Receipt */}
              {selectedOrder.receiptUrl && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">{t('receipt')}</h4>
                  <a
                    href={selectedOrder.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selectedOrder.receiptUrl}
                      alt="Payment receipt"
                      className="max-h-48 rounded-lg border object-contain"
                    />
                  </a>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">{t('updateStatus')}</h4>
                <div className="flex gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                    disabled={updating}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verify Payment Button */}
                {selectedOrder.paymentStatus === 'pending_verification' && (
                  <Button
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => verifyPayment(selectedOrder.id)}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    {t('verifyPayment')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
