'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  ShoppingCart,
} from 'lucide-react'
import { useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { isAdmin } from '@/lib/admin'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import { useCart } from '@/components/shop/CartProvider'
import { CartDrawer } from '@/components/shop/CartDrawer'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin)
  const t = useTranslations('nav')
  const { getItemCount, setIsOpen: setCartOpen } = useCart()
  const cartItemCount = getItemCount()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 outline-none focus:outline-none"
            >
              <div className="w-8 h-8 bg-[#1854d6] rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">TZH</span>
              </div>
              <span className="text-base font-semibold text-foreground hidden sm:block">
                TZH Sports Centre
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/booking"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('lessons')}
            </Link>

            <Link
              href="/shop"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('shop')}
            </Link>

            {session?.user && (
              <Link
                href="/member"
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('admin')}
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#1854d6] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            <LanguageSwitcher />
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-card animate-pulse" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/10"
                  >
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="text-sm bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full px-4">
                    {t('signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1">
            {/* Mobile Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#1854d6] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground"
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
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-6 py-4 space-y-1">
            <Link
              href="/booking"
              className="block py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('booking')}
            </Link>
            <Link
              href="/lessons"
              className="block py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('lessons')}
            </Link>

            <Link
              href="/shop"
              className="block py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('shop')}
            </Link>

            {session?.user && (
              <Link
                href="/member"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('member')}
              </Link>
            )}
            {session?.user && (
              <Link
                href="/updates"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('updates')}
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('admin')}
              </Link>
            )}
            <hr className="my-3 border-border" />
            <div className="py-2">
              <LanguageSwitcher />
            </div>
            <hr className="my-3 border-border" />
            {session?.user ? (
              <>
                <div className="py-2 text-sm text-muted-foreground">
                  {session.user.name}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block py-2 text-red-600 hover:text-red-500"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block py-2 text-[#0a2540] font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {/* Cart Drawer */}
      <CartDrawer />
    </nav>
  )
}
