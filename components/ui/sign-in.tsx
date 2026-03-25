'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Testimonial {
  avatarSrc: string
  name: string
  handle: string
  text: string
}

interface SignInPageProps {
  title: ReactNode
  description?: ReactNode
  heroImageSrc: string
  testimonials?: Testimonial[]
  onSignIn: (formData: FormData) => Promise<void>
  onCreateAccount?: () => void
  onGoogleSignIn?: () => void
  onResetPassword?: () => void
}

export function SignInPage({
  title,
  description,
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onCreateAccount,
  onGoogleSignIn,
  onResetPassword,
}: SignInPageProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSignIn(new FormData(e.currentTarget))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Left: form panel */}
      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-background px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">

          {/* Brand */}
          <div className="animate-element mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="text-sm font-bold text-white">TZH</span>
              </div>
              <span className="text-base font-semibold text-foreground">TZH Sports Centre</span>
            </div>
          </div>

          {/* Heading */}
          <div className="animate-element animate-delay-100 mb-8">
            <h1 className="text-[2rem] font-semibold leading-tight text-foreground">{title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">{description}</div>
          </div>

          {/* Optional Google SSO */}
          {onGoogleSignIn && (
            <div className="animate-element animate-delay-200 mb-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-border"
                onClick={onGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Sign-in form */}
          <form onSubmit={handleSubmit} className="animate-element animate-delay-200 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
                Email or Phone
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="Email or phone number"
                required
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                {onResetPassword && (
                  <button
                    type="button"
                    onClick={onResetPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-full bg-primary text-white hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in&hellip;
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {onCreateAccount && (
            <div className="animate-element animate-delay-300 mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onCreateAccount}
                className="font-medium text-primary hover:underline"
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: hero panel — desktop only */}
      <div className="animate-slide-right hidden lg:relative lg:flex lg:flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageSrc}
          alt="Sports centre court"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

        {testimonials.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 space-y-3 p-8">
            {testimonials.map((item, i) => {
              const delayClass = `animate-delay-${600 + i * 100}` as string
              return (
                <div
                  key={item.handle}
                  className={`animate-testimonial ${delayClass} rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm`}
                >
                  <p className="mb-3 text-sm text-white/90">&ldquo;{item.text}&rdquo;</p>
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.avatarSrc}
                      alt={item.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/60">{item.handle}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
