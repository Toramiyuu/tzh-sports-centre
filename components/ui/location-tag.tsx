"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

interface LocationTagProps {
  city?: string
  country?: string
  timezone?: string
  ianaTimezone?: string
}

export function LocationTag({
  city = "San Francisco",
  country = "USA",
  timezone = "PST",
  ianaTimezone = "America/Los_Angeles",
}: LocationTagProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: ianaTimezone,
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [ianaTimezone])

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center gap-3 rounded-full border border-border/60 bg-secondary/50 px-4 py-2.5 transition-all duration-500 ease-out hover:border-foreground/20 hover:bg-secondary/80 hover:shadow-[0_0_20px_rgba(0,0,0,0.04)]"
    >
      {/* Live pulse indicator */}
      <div className="relative flex items-center justify-center">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </div>

      {/* Location / time flip */}
      <div className="relative flex items-center overflow-hidden h-5 w-fit min-w-[155px]">
        <span
          className="absolute text-sm font-medium text-foreground transition-all duration-500 whitespace-nowrap"
          style={{
            transform: isHovered ? "translateY(-100%)" : "translateY(0)",
            opacity: isHovered ? 0 : 1,
          }}
        >
          {city}, {country}
        </span>

        <span
          className="absolute text-sm font-medium text-foreground transition-all duration-500 whitespace-nowrap"
          style={{
            transform: isHovered ? "translateY(0)" : "translateY(100%)",
            opacity: isHovered ? 1 : 0,
          }}
        >
          {currentTime} {timezone}
        </span>
      </div>

      {/* Arrow indicator */}
      <ArrowUpRight
        className="h-3.5 w-3.5 text-muted-foreground transition-all duration-300"
        style={{
          transform: isHovered ? "translateX(1px) translateY(-1px)" : "translateX(0) translateY(0)",
          opacity: isHovered ? 1 : 0.4,
        }}
      />
    </button>
  )
}
