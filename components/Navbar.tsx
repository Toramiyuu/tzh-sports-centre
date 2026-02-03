'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { isAdmin } from '@/lib/admin'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin)
  const t = useTranslations('nav')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 outline-none focus:outline-none">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">TZH</span>
              </div>
              <span className="text-base font-semibold text-neutral-900 hidden sm:block">
                TZH Sports Centre
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/booking"
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {t('lessons')}
            </Link>
            <Link
              href="/stringing"
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              {t('stringing')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {t('admin')}
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="text-sm bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-4">
                    {t('signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900"
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
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-6 py-4 space-y-1">
            <Link
              href="/booking"
              className="block py-2 text-neutral-600 hover:text-neutral-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="block py-2 text-neutral-600 hover:text-neutral-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('lessons')}
            </Link>
            <Link
              href="/stringing"
              className="block py-2 text-neutral-600 hover:text-neutral-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('stringing')}
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="block py-2 text-neutral-600 hover:text-neutral-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="block py-2 text-neutral-600 hover:text-neutral-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="block py-2 text-neutral-600 hover:text-neutral-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
            <hr className="my-3 border-neutral-200" />
            <div className="py-2">
              <LanguageSwitcher />
            </div>
            <hr className="my-3 border-neutral-200" />
            {session?.user ? (
              <>
                <div className="py-2 text-sm text-neutral-500">
                  {session.user.name}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block py-2 text-red-600 hover:text-red-700"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block py-2 text-neutral-600 hover:text-neutral-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block py-2 text-neutral-900 font-medium"
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
