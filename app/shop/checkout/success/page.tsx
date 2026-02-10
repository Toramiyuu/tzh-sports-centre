'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('shop.checkout')
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-[#f5f8ff] pt-24 pb-12">
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-[#EDF1FD] rounded-2xl p-8 space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-[#0a2540]">{t('orderSuccess')}</h1>
            <p className="text-[#0a2540]/60 mt-2">{t('orderSuccessDesc')}</p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="bg-white rounded-xl p-4 border border-[#0a2540]/10">
              <p className="text-sm text-[#0a2540]/50">{t('orderId')}</p>
              <p className="text-lg font-mono font-semibold text-[#0a2540] mt-1">
                {orderId.slice(-8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Info */}
          <p className="text-sm text-[#0a2540]/50">
            {t('pickupInfo')}
          </p>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link href="/shop">
              <Button className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full py-6 text-base">
                <ShoppingBag className="mr-2 h-5 w-5" />
                {t('continueShopping')}
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full rounded-full border-[#0a2540]/10 text-[#0a2540] py-6 text-base mt-3"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t('backToHome')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
