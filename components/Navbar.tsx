'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CalendarDays, User, Menu, X, Shield, Receipt, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { isAdmin } from '@/lib/admin'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const userIsAdmin = isAdmin(session?.user?.email)
  const t = useTranslations('nav')

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 outline-none focus:outline-none">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TZH</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                TZH Sports Centre
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-8">
            <Link
              href="/booking"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              {t('lessons')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('member')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
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
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">{t('login')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{t('signup')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900"
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
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/booking"
              className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('lessons')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('member')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
            <hr className="my-2" />
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            <hr className="my-2" />
            {session?.user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600">
                  {session.user.name}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md bg-blue-600 text-white text-center"
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
