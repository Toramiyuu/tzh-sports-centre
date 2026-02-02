'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, Repeat } from 'lucide-react'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/profile/recurring')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.recurringBookings)
      }
    } catch (error) {
      console.error('Error fetching recurring bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">{t('noBookings')}</p>
      </div>
    )
  }

  const active = bookings.filter(b => b.isActive)
  const inactive = bookings.filter(b => !b.isActive)

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((booking) => (
            <Card key={booking.id} className="border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{t('every')} {booking.schedule}</span>
                      <Badge className="bg-green-600 text-white">{t('active')}</Badge>
                      {booking.label && <Badge variant="outline">{booking.label}</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{booking.time} ({booking.duration}hr)</span>
                    </div>
                    <div className="text-gray-600">
                      {booking.court} | <span className="capitalize">{booking.sport}</span>
                    </div>

                    {/* Current month status */}
                    <div className="mt-3 flex items-center gap-2">
                      <PaymentBadge status={booking.currentMonth.status} />
                      <span className="text-sm text-gray-600">
                        {booking.currentMonth.sessionsCount} {t('sessions')} &times; RM{booking.amountPerSession.toFixed(2)} = <span className="font-semibold">RM{booking.currentMonth.amount.toFixed(2)}</span>
                      </span>
                    </div>

                    {/* Payment history */}
                    {booking.history.length > 1 && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                          {t('paymentHistory')} ({booking.history.length})
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {booking.history.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600 w-20">{h.monthLabel}</span>
                              <PaymentBadge status={h.status} />
                              <span className="font-medium">RM{h.totalAmount.toFixed(2)}</span>
                              {h.paymentMethod && (
                                <span className="text-gray-400 text-xs">via {h.paymentMethod}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold">RM{booking.amountPerSession.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{t('perSession')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 mt-6">{t('inactive')}</h3>
          {inactive.map((booking) => (
            <Card key={booking.id} className="opacity-60">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('every')} {booking.schedule}</span>
                      <Badge variant="outline">{t('inactiveLabel')}</Badge>
                      {booking.label && <Badge variant="outline">{booking.label}</Badge>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {booking.time} | {booking.court} | <span className="capitalize">{booking.sport}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">RM{booking.amountPerSession.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{t('perSession')}</div>
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
