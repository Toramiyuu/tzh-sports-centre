'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SignUpPage } from '@/components/ui/sign-up'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth.register')
  const tCommon = useTranslations('common')
  const [error, setError] = useState('')

  const handleSignUp = async (data: {
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
  }) => {
    setError('')

    if (data.password !== data.confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    if (data.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Registration failed')
        return
      }

      const signInResult = await signIn('credentials', {
        identifier: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push('/auth/login?registered=true')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError(tCommon('error'))
    }
  }

  return (
    <SignUpPage
      title={<span className="font-light tracking-tighter">{t('title')}</span>}
      description={
        error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          t('subtitle')
        )
      }
      heroImageSrc="/images/court-view-1.jpg"
      onSignUp={handleSignUp}
      onSignIn={() => router.push('/auth/login')}
    />
  )
}
