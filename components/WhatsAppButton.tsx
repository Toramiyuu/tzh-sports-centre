'use client'

import { MessageCircle } from 'lucide-react'

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/60116868508?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20court%20booking"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl group"
      aria-label="Chat on WhatsApp"
    >
      <div className="w-14 h-14 flex items-center justify-center">
        <MessageCircle className="w-7 h-7" />
      </div>
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:pr-4 transition-all duration-300 whitespace-nowrap text-sm font-medium">
        WhatsApp Us
      </span>
    </a>
  )
}
