'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Search,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface TrackedOrder {
  jobUid: string
  status: string
  stringName: string
  stringColor: string | null
  price: number
  racketModel: string
  racketModelCustom: string | null
  tensionMain: number
  tensionCross: number
  pickupDate: string
  notes: string | null
  receivedAt: string | null
  inProgressAt: string | null
  readyAt: string | null
  collectedAt: string | null
  createdAt: string
}

const STATUS_STEPS = [
  { key: 'RECEIVED', label: 'Received', icon: Package },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
  { key: 'READY', label: 'Ready', icon: CheckCircle2 },
  { key: 'COLLECTED', label: 'Collected', icon: Check },
]

export default function TrackOrderPage() {
  const t = useTranslations('stringing')
  const tCommon = useTranslations('common')

  const [jobUid, setJobUid] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobUid.trim() || !phone.trim()) {
      toast.error(t('track.fieldsRequired'))
      return
    }

    setLoading(true)
    setNotFound(false)
    setOrder(null)

    try {
      const res = await fetch('/api/stringing/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUid: jobUid.trim().toUpperCase(),
          phone: phone.trim(),
        }),
      })

      const data = await res.json()

      if (data.found) {
        setOrder(data.order)
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      toast.error(t('track.error'))
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = (status: string) => {
    return STATUS_STEPS.findIndex(step => step.key === status)
  }

  const getStatusTimestamp = (order: TrackedOrder, status: string) => {
    switch (status) {
      case 'RECEIVED':
        return order.receivedAt
      case 'IN_PROGRESS':
        return order.inProgressAt
      case 'READY':
        return order.readyAt
      case 'COLLECTED':
        return order.collectedAt
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/stringing"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon('back')}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('track.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('track.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobUid">{t('track.jobUid')} *</Label>
                  <Input
                    id="jobUid"
                    value={jobUid}
                    onChange={(e) => setJobUid(e.target.value.toUpperCase())}
                    placeholder={t('track.jobUidPlaceholder')}
                    className="uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('track.phone')} *</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder={t('track.phonePlaceholder')}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !jobUid.trim() || !phone.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('track.searching')}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {t('track.trackButton')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Not Found */}
        {notFound && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-red-900 mb-2">
                {t('track.notFound')}
              </h3>
              <p className="text-red-700 text-sm">
                {t('track.notFoundDesc')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('track.orderStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">{t('track.jobUidLabel')}</span>
                  <p className="text-xl font-bold text-foreground">{order.jobUid}</p>
                </div>

                {/* Progress Steps */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-accent hidden sm:block" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-foreground hidden sm:block transition-all duration-500"
                    style={{
                      width: `${(getCurrentStepIndex(order.status) / (STATUS_STEPS.length - 1)) * 100}%`,
                      maxWidth: 'calc(100% - 40px)',
                    }}
                  />

                  {/* Steps */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
                    {STATUS_STEPS.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(order.status)
                      const isCompleted = index <= currentIndex
                      const isCurrent = index === currentIndex
                      const timestamp = getStatusTimestamp(order, step.key)
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
                              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                              isCompleted
                                ? 'bg-foreground text-white'
                                : 'bg-accent text-muted-foreground',
                              isCurrent && 'ring-4 ring-blue-200'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="sm:text-center">
                            <p
                              className={cn(
                                'font-medium text-sm',
                                isCompleted ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {step.label}
                            </p>
                            {timestamp && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(timestamp), 'dd/MM HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  {t('track.orderDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('track.string')}</p>
                    <p className="font-medium">{order.stringName}</p>
                    {order.stringColor && (
                      <p className="text-muted-foreground">{order.stringColor}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('track.price')}</p>
                    <p className="font-medium text-foreground">RM{order.price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('track.racket')}</p>
                    <p className="font-medium">
                      {order.racketModelCustom || order.racketModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('track.tension')}</p>
                    <p className="font-medium">
                      {order.tensionMain} / {order.tensionCross} lbs
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('track.pickupDate')}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(order.pickupDate), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('track.orderDate')}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(order.createdAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-muted-foreground text-sm">{t('track.notes')}</p>
                    <p className="text-sm mt-1 bg-background p-3 rounded-lg">
                      {order.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
