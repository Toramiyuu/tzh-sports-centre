'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { CalendarDays, User, Menu, X, Shield, Receipt, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { UserMenu } from '@/components/UserMenu'
import { isAdmin } from '@/lib/admin'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const userIsAdmin = isAdmin(session?.user?.email)

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
              Book Court
            </Link>
            <Link
              href="/lessons"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Lessons
            </Link>
            <Link
              href="/receipt"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Find Booking
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Training
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* Auth Section - Conditional Rendering */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ) : session?.user ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
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
              Book Court
            </Link>
            <Link
              href="/lessons"
              className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Lessons
            </Link>
            <Link
              href="/receipt"
              className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Booking
            </Link>
            {session?.user && (
              <Link
                href="/member"
                className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Training
              </Link>
            )}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            <hr className="my-2" />
            {session?.user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600">
                  Signed in as <span className="font-medium">{session.user.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md bg-blue-600 text-white text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
