'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hide loading screen once the page is fully loaded
    const handleLoad = () => {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 300)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center transition-opacity duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="relative">
          <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-semibold text-xl">TZH</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 border-2 border-teal-500/30 rounded-2xl animate-spin-slow"
               style={{ borderTopColor: 'rgb(20 184 166)' }} />
        </div>

        {/* Loading text */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-sm tracking-wider">Loading</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
