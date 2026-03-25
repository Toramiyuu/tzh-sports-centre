'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SignInPage } from '@/components/ui/sign-in'

const TESTIMONIALS = [
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/45.jpg',
    name: 'Ahmad Faizal',
    handle: '@faizal_kl',
    text: 'Best badminton court in Penang! Clean facilities and great value for members.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Li Wei',
    handle: '@liwei_pg',
    text: 'Love the online booking system. So convenient to reserve courts anytime.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/72.jpg',
    name: 'Rajan Kumar',
    handle: '@rajan_pg',
    text: 'The coaching sessions are excellent. My game has improved so much this year.',
  },
]

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl') || '/'
  // Only allow relative paths — block protocol-relative (//evil.com) and absolute URLs
  const callbackUrl = rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/'
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')

  const [error, setError] = useState('')

  const handleSignIn = async (formData: FormData) => {
    setError('')
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('error'))
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError(tCommon('error'))
    }
  }

  return (
    <SignInPage
      title={<span className="font-light tracking-tighter">{t('title')}</span>}
      description={
        error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          t('subtitle')
        )
      }
      heroImageSrc="/images/court-view-2.jpg"
      testimonials={TESTIMONIALS}
      onSignIn={handleSignIn}
      onCreateAccount={() => router.push('/auth/register')}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}
