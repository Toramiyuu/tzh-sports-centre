'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  customerName: string
  items: OrderItem[]
  total: number
  status: string
  paymentMethod: string | null
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

const STATUS_STEPS = [
  { key: 'PENDING_PAYMENT', icon: CreditCard },
  { key: 'CONFIRMED', icon: CheckCircle2 },
  { key: 'PREPARING', icon: Package },
  { key: 'READY_FOR_PICKUP', icon: Truck },
  { key: 'COMPLETED', icon: Check },
]

export default function ShopOrdersPage() {
  const { data: session, status: sessionStatus } = useSession()
  const t = useTranslations('shop.orders')
  const tCommon = useTranslations('common')

  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [trackedOrder, setTrackedOrder] = useState<ShopOrder | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user's orders if logged in
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      fetchOrders()
    }
  }, [sessionStatus, session])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shop/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch {
      toast.error(t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim() || !phone.trim()) {
      toast.error(t('fieldsRequired'))
      return
    }

    setSearching(true)
    setNotFound(false)
    setTrackedOrder(null)

    try {
      const res = await fetch('/api/shop/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId.trim(),
          phone: phone.trim(),
        }),
      })

      const data = await res.json()

      if (data.found) {
        setTrackedOrder(data.order)
      } else {
        setNotFound(true)
      }
    } catch {
      toast.error(t('trackError'))
    } finally {
      setSearching(false)
    }
  }

  const getCurrentStepIndex = (status: string) => {
    if (status === 'CANCELLED') return -1
    return STATUS_STEPS.findIndex((step) => step.key === status)
  }

  const renderStatusTimeline = (order: ShopOrder) => {
    const currentIndex = getCurrentStepIndex(order.status)

    if (order.status === 'CANCELLED') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 font-semibold">{t('statusCancelled')}</p>
        </div>
      )
    }

    return (
      <div className="relative">
        {/* Progress line - horizontal on desktop, vertical on mobile */}
        <div className="hidden sm:block absolute top-5 left-5 right-5 h-0.5 bg-[#0a2540]/10" />
        <div
          className="hidden sm:block absolute top-5 left-5 h-0.5 bg-[#1854d6] transition-all duration-500"
          style={{
            width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 40px)',
          }}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex
            const isCurrent = index === currentIndex
            const Icon = step.icon

            return (
              <div
                key={step.key}
                className={cn(
                  'flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 relative z-10',
                  'sm:flex-1'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
                    isCompleted
                      ? 'bg-[#1854d6] text-white'
                      : 'bg-[#0a2540]/10 text-[#0a2540]/40',
                    isCurrent && 'ring-4 ring-[#1854d6]/20'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p
                  className={cn(
                    'font-medium text-sm',
                    isCompleted ? 'text-[#0a2540]' : 'text-[#0a2540]/40'
                  )}
                >
                  {t(`status.${step.key}`)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderOrderCard = (order: ShopOrder) => {
    const items = order.items as OrderItem[]

    return (
      <div key={order.id} className="bg-[#EDF1FD] rounded-2xl p-6 space-y-4">
        {/* Order header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#0a2540]/50 font-mono">{t('orderId')}: {order.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-[#0a2540]/60 mt-1">
              {format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}
            </p>
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-3 py-1 rounded-full',
              order.status === 'COMPLETED' && 'bg-green-100 text-green-700',
              order.status === 'CANCELLED' && 'bg-red-100 text-red-700',
              order.status === 'READY_FOR_PICKUP' && 'bg-blue-100 text-blue-700',
              order.status === 'PREPARING' && 'bg-yellow-100 text-yellow-700',
              order.status === 'CONFIRMED' && 'bg-emerald-100 text-emerald-700',
              order.status === 'PENDING_PAYMENT' && 'bg-orange-100 text-orange-700'
            )}
          >
            {t(`status.${order.status}`)}
          </span>
        </div>

        {/* Status timeline */}
        {renderStatusTimeline(order)}

        {/* Items */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
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
                <p className="text-sm font-medium text-[#0a2540] line-clamp-1">{item.name}</p>
                {(item.selectedSize || item.selectedColor) && (
                  <p className="text-xs text-[#0a2540]/50">
                    {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-[#0a2540]">x{item.quantity}</p>
                <p className="text-xs text-[#0a2540]/60">RM{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-[#0a2540]/10">
          <span className="text-sm text-[#0a2540]/60">{t('total')}</span>
          <span className="text-lg font-bold text-[#0a2540]">RM{order.total.toFixed(0)}</span>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-[#0a2540]/60 hover:text-[#0a2540] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToShop')}
          </Link>
          <h1 className="text-3xl font-semibold text-[#0a2540]">{t('title')}</h1>
          <p className="text-[#0a2540]/60 mt-1">{t('subtitle')}</p>
        </div>

        {/* Track Order Form (always shown, for non-logged-in users or lookup by ID) */}
        <div className="bg-[#EDF1FD] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0a2540] mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t('trackOrder')}
          </h2>
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderId" className="text-sm text-[#0a2540]">
                  {t('orderIdLabel')} *
                </Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder={t('orderIdPlaceholder')}
                  className="bg-white border-[#0a2540]/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackPhone" className="text-sm text-[#0a2540]">
                  {t('phone')} *
                </Label>
                <PhoneInput
                  id="trackPhone"
                  value={phone}
                  onChange={setPhone}
                  className="bg-white border-[#0a2540]/10"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full py-5"
              disabled={searching || !orderId.trim() || !phone.trim()}
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('searching')}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  {t('trackButton')}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-red-900 mb-2">{t('notFound')}</h3>
            <p className="text-red-700 text-sm">{t('notFoundDesc')}</p>
          </div>
        )}

        {/* Tracked Order Result */}
        {trackedOrder && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#0a2540] mb-4">{t('trackResult')}</h2>
            {renderOrderCard(trackedOrder)}
          </div>
        )}

        {/* User's Orders (if logged in) */}
        {sessionStatus === 'authenticated' && (
          <div>
            <h2 className="text-lg font-semibold text-[#0a2540] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {t('myOrders')}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a2540]/30" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[#EDF1FD] rounded-2xl p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-[#0a2540]/20 mx-auto mb-4" />
                <p className="text-[#0a2540]/60">{t('noOrders')}</p>
                <Link href="/shop">
                  <Button className="bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full mt-4 px-6">
                    {t('goShopping')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => renderOrderCard(order))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
