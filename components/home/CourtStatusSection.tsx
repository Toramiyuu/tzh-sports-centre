'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface SlotInfo {
  slotTime: string
  available: boolean
  isPast: boolean
}

interface CourtAvailability {
  court: { id: number; name: string }
  slots: SlotInfo[]
}

function getCurrentMalaysiaTime(): string {
  const now = new Date()
  const myt = now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
  const d = new Date(myt)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getMalaysiaDateString(): string {
  const now = new Date()
  const myt = now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })
  const d = new Date(myt)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + hours * 60
  const newH = Math.min(Math.floor(totalMinutes / 60), 23)
  const newM = totalMinutes % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}


export function CourtStatusSection() {
  const t = useTranslations('home.courtStatus')
  const [courts, setCourts] = useState<CourtAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const date = getMalaysiaDateString()
      const res = await fetch(`/api/availability?date=${date}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCourts(data.availability || [])
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) return null

  if (error || courts.length === 0) return null

  const now = getCurrentMalaysiaTime()
  const twoHoursLater = addHours(now, 2)

  const courtStatuses = courts.map(({ court, slots }) => {
    const upcomingSlots = slots.filter(
      (s) => !s.isPast && s.slotTime >= now && s.slotTime < twoHoursLater
    )
    const totalUpcoming = upcomingSlots.length
    // Court is free if the current (first upcoming) slot is available
    const isFreeNow = upcomingSlots.length > 0 && upcomingSlots[0].available
    return { court, totalUpcoming, isFreeNow }
  })

  // If no upcoming slots at all (outside operating hours), don't show
  const hasAnySlots = courtStatuses.some((c) => c.totalUpcoming > 0)
  if (!hasAnySlots) return null

  return (
    <section className="py-8 md:py-12 bg-background animate-in fade-in duration-500 fill-mode-forwards">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="w-4 h-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('title')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {courtStatuses.map(({ court, totalUpcoming, isFreeNow }) => {
            const statusText = totalUpcoming === 0
              ? t('closed')
              : isFreeNow
                ? t('available')
                : t('fullyBooked')
            return (
              <Link
                key={court.id}
                href={`/booking?court=${court.id}`}
                className={`relative rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isFreeNow
                    ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                    : 'border-border bg-card hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isFreeNow ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {court.name}
                  </span>
                </div>
                <p className={`text-xs ${isFreeNow ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {statusText}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
