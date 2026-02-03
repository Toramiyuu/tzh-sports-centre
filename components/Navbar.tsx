'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CalendarDays, User, Menu, X, Shield, GraduationCap, Wrench, Newspaper } from 'lucide-react'
import { useState, useEffect } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { isAdmin } from '@/lib/admin'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()
  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin)
  const t = useTranslations('nav')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-700'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 outline-none focus:outline-none">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TZH</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                TZH Sports Centre
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-8">
            <Link
              href="/booking"
              className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              {t('lessons')}
            </Link>
            <Link
              href="/stringing"
              className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              {t('stringing')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4" />
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Newspaper className="w-4 h-4" />
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4" />
                {t('admin')}
              </Link>
            )}
          </div>

          {/* Auth Section - Conditional Rendering */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <LanguageSwitcher />
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full bg-zinc-700 animate-pulse" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/10">
                  <Link href="/auth/login">{t('login')}</Link>
                </Button>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Link href="/auth/register">{t('signup')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-white/70 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-700">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/booking"
              className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('lessons')}
            </Link>
            <Link
              href="/stringing"
              className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('stringing')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 rounded-md text-amber-400 hover:bg-amber-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
            <hr className="my-2 border-slate-600" />
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            <hr className="my-2 border-slate-600" />
            {session?.user ? (
              <>
                <div className="px-3 py-2 text-sm text-zinc-400">
                  {session.user.name}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-red-950"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md bg-amber-500 text-white text-center hover:bg-amber-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
