'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'

function CancelContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-orange-500" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. Don&apos;t worry - no charges were made.
            Your selected time slots may still be available.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/booking')}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-6 text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="tel:01168688508" className="text-neutral-900 hover:underline">
              011-6868 8508
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-900" />
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  )
}
