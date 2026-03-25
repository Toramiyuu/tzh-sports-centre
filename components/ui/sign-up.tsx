'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Perk {
  icon: string
  title: string
  description: string
}

interface SignUpPageProps {
  title: ReactNode
  description?: ReactNode
  heroImageSrc?: string
  perks?: Perk[]
  onSignUp: (data: {
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  onSignIn?: () => void
}

const DEFAULT_PERKS: Perk[] = [
  {
    icon: '🏸',
    title: 'Book courts 24/7',
    description: 'Reserve courts instantly from any device. Live availability and instant confirmation.',
  },
  {
    icon: '💎',
    title: 'Earn reward credits',
    description: 'Every session earns credits redeemable for free courts and pro shop discounts.',
  },
  {
    icon: '🎓',
    title: 'Priority coaching access',
    description: 'Members get first access to BAM-certified coaching sessions and clinics.',
  },
]

export function SignUpPage({
  title,
  description,
  heroImageSrc = 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=2160&q=80',
  perks = DEFAULT_PERKS,
  onSignUp,
  onSignIn,
}: SignUpPageProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSignUp({ name, email, phone, password, confirmPassword })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* ── Left: form panel ──────────────────────────────────────────── */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="animate-element animate-delay-200 space-y-4">
            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ahmad Faizal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number
              </Label>
              <PhoneInput
                id="phone"
                value={phone}
                onChange={setPhone}
                disabled={loading}
              />
            </div>

            {/* Password + Confirm — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-full bg-primary text-white hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account&hellip;
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {onSignIn && (
            <div className="animate-element animate-delay-300 mt-6 text-center text-sm text-muted-foreground">
              Already a member?{' '}
              <button
                type="button"
                onClick={onSignIn}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: hero panel — desktop only ──────────────────────────── */}
      <div className="animate-slide-right hidden lg:relative lg:flex lg:flex-1 lg:flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageSrc}
          alt="TZH Sports Centre pickleball court"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        {/* Member count badge */}
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
            247+ active members
          </span>
        </div>

        {/* Perks */}
        <div className="absolute bottom-0 left-0 right-0 space-y-3 p-8">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
            Member benefits
          </p>
          {perks.map((perk, i) => (
            <div
              key={perk.title}
              className={cn(
                'animate-testimonial rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm',
                i === 0 && 'animate-delay-300',
                i === 1 && 'animate-delay-500',
                i === 2 && 'animate-delay-700',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg leading-none">{perk.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{perk.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/60">{perk.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
