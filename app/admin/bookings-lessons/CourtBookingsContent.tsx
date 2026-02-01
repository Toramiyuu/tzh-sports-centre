'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarDays, CreditCard, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

const BookingsContent = dynamic(() => import('@/components/admin/BookingsContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

const PaymentsContent = dynamic(() => import('@/components/admin/PaymentsContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

type SubTab = 'bookings' | 'payments'

export default function CourtBookingsContent() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('bookings')
  const t = useTranslations('admin')

  return (
    <div className="space-y-4">
      {/* Sub-tabs as pills */}
      <div className="flex gap-2">
        <Button
          variant={activeSubTab === 'bookings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSubTab('bookings')}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          {t('courtManagement.tabs.bookings')}
        </Button>
        <Button
          variant={activeSubTab === 'payments' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSubTab('payments')}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {t('courtManagement.tabs.payments')}
        </Button>
      </div>

      {activeSubTab === 'bookings' && <BookingsContent />}
      {activeSubTab === 'payments' && <PaymentsContent />}
    </div>
  )
}
