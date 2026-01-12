import Link from 'next/link'
import { MapPin, Phone, Clock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TZH</span>
              </div>
              <span className="text-xl font-bold">TZH Badminton</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your premier destination for badminton in the area. 4 professional
              courts available for booking daily.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>123 Sports Avenue, Penang, Malaysia</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>+60 12-345 6789</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span>Daily: 9:00 AM - 12:00 AM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/booking"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Book a Court
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                My Bookings
              </Link>
              <Link
                href="/auth/login"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="block text-gray-400 hover:text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} TZH Badminton. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
