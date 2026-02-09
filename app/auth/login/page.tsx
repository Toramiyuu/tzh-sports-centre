'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
    } finally {
      setLoading(false)
    }
  }

  return (
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
            <Label htmlFor="identifier" className="text-muted-foreground">{t('emailOrPhone')}</Label>
            <Input
              id="identifier"
              type="text"
              placeholder={t('emailOrPhonePlaceholder')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
              className="rounded-lg border-border bg-background text-foreground"
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              t('signIn')
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-[#0a2540] font-medium hover:underline">
              {t('signUp')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12 bg-background">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-card border border-border rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-foreground">{t('title')}</CardTitle>
            <CardDescription className="text-muted-foreground">{tCommon('loading')}</CardDescription>
          </CardHeader>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
