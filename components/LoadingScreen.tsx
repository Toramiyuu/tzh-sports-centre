'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout>
    let maxTimer: ReturnType<typeof setTimeout>

    const hide = () => {
      // Small delay to ensure smooth transition
      delayTimer = setTimeout(() => setIsLoading(false), 300)
    }

    if (document.readyState === 'complete') {
      hide()
    } else {
      window.addEventListener('load', hide)
      // Fallback: auto-hide after 5s even if load event never fires
      maxTimer = setTimeout(hide, 5000)
    }

    return () => {
      window.removeEventListener('load', hide)
      clearTimeout(delayTimer)
      clearTimeout(maxTimer)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-semibold text-xl">TZH</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 border-2 border-primary/30 rounded-2xl animate-spin-slow"
               style={{ borderTopColor: 'var(--primary)' }} />
        </div>

        {/* Loading text */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm tracking-wider">Loading</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
