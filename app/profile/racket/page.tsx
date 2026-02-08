'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { RacketTab } from '@/components/profile/RacketTab'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function RacketProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('profile.racket')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile/racket')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="animate-pulse">
          <div className="h-8 bg-accent rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-accent rounded"></div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground hover:text-foreground">
          <Link href="/profile">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToProfile')}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Racket Form */}
      <RacketTab />
    </div>
  )
}
