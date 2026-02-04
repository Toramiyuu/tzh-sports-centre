'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, Repeat, AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface RecurringBookingData {
  id: string
  schedule: string
  time: string
  duration: number
  sport: string
  court: string
  label: string | null
  isActive: boolean
  amountPerSession: number
  currentMonth: {
    status: string
    amount: number
    sessionsCount: number
  }
  history: Array<{
    month: number
    year: number
    monthLabel: string
    totalAmount: number
    status: string
    paidAt: string | null
    paymentMethod: string | null
  }>
}

function PaymentBadge({ status }: { status: string }) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-600 text-white">Paid</Badge>
    case 'overdue':
      return <Badge className="bg-red-600 text-white">Overdue</Badge>
    case 'unpaid':
      return <Badge className="bg-amber-500 text-white">Unpaid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function RecurringTab() {
  const t = useTranslations('profile.recurring')
  const [bookings, setBookings] = useState<RecurringBookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      const res = await fetch('/api/profile/recurring')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.recurringBookings)
      } else {
        setError('Failed to load recurring bookings')
      }
    } catch (err) {
      console.error('Error fetching recurring bookings:', err)
      setError('Failed to load recurring bookings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">{t('noBookings')}</p>
      </div>
    )
  }

  const active = bookings.filter(b => b.isActive)
  const inactive = bookings.filter(b => !b.isActive)

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => { setError(null); setLoading(true); fetchData() }}
            className="flex items-center gap-1 text-red-700 hover:text-red-800 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((booking) => (
            <Card key={booking.id} className="border border-neutral-200 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg text-neutral-900">{t('every')} {booking.schedule}</span>
                      <Badge className="bg-green-600 text-white">{t('active')}</Badge>
                      {booking.label && <Badge variant="outline" className="border-neutral-200">{booking.label}</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{booking.time} ({booking.duration}hr)</span>
                    </div>
                    <div className="text-neutral-500">
                      {booking.court} | <span className="capitalize">{booking.sport}</span>
                    </div>

                    {/* Current month status */}
                    <div className="mt-3 flex items-center gap-2">
                      <PaymentBadge status={booking.currentMonth.status} />
                      <span className="text-sm text-neutral-600">
                        {booking.currentMonth.sessionsCount} {t('sessions')} &times; RM{booking.amountPerSession.toFixed(2)} = <span className="font-semibold">RM{booking.currentMonth.amount.toFixed(2)}</span>
                      </span>
                    </div>

                    {/* Payment history */}
                    {booking.history.length > 1 && (
                      <details className="mt-3">
                        <summary className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-700">
                          {t('paymentHistory')} ({booking.history.length})
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {booking.history.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-neutral-600 w-20">{h.monthLabel}</span>
                              <PaymentBadge status={h.status} />
                              <span className="font-medium text-neutral-900">RM{h.totalAmount.toFixed(2)}</span>
                              {h.paymentMethod && (
                                <span className="text-neutral-400 text-xs">via {h.paymentMethod}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-neutral-900">RM{booking.amountPerSession.toFixed(2)}</div>
                    <div className="text-sm text-neutral-500">{t('perSession')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-500 mt-6">{t('inactive')}</h3>
          {inactive.map((booking) => (
            <Card key={booking.id} className="opacity-60 border border-neutral-200 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">{t('every')} {booking.schedule}</span>
                      <Badge variant="outline" className="border-neutral-200">{t('inactiveLabel')}</Badge>
                      {booking.label && <Badge variant="outline" className="border-neutral-200">{booking.label}</Badge>}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      {booking.time} | {booking.court} | <span className="capitalize">{booking.sport}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-neutral-900">RM{booking.amountPerSession.toFixed(2)}</div>
                    <div className="text-xs text-neutral-500">{t('perSession')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
