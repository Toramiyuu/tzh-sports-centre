'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth.register')
  const tCommon = useTranslations('common')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      const signInResult = await signIn('credentials', {
        identifier: email,
        password,
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 bg-background">
      <Card className="w-full max-w-md bg-card border border-border rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">{t('title')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/30 text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="rounded-lg border-border bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="rounded-lg border-border bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-muted-foreground">{t('phone')}</Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-lg border-border bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-muted-foreground">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-lg border-border bg-background text-foreground"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-white rounded-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                t('title')
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('hasAccount')}{' '}
              <Link href="/auth/login" className="text-teal-400 font-medium hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
