"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

export interface Testimonial {
  quote: string
  author: string
  role: string
  stars?: number
  avatarUrl?: string
}

interface EditorialTestimonialProps {
  testimonials: Testimonial[]
}

export function EditorialTestimonial({ testimonials }: EditorialTestimonialProps) {
  const [active, setActive] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleChange = (index: number) => {
    if (index === active || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActive(index)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }

  const handlePrev = () => {
    handleChange(active === 0 ? testimonials.length - 1 : active - 1)
  }

  const handleNext = () => {
    handleChange(active === testimonials.length - 1 ? 0 : active + 1)
  }

  const current = testimonials[active]

  return (
    <div className="w-full">
      <div className="flex items-start gap-6 md:gap-10">
        {/* Large index number */}
        <span
          className="text-[80px] md:text-[120px] font-light leading-none text-foreground/10 select-none transition-all duration-500 shrink-0"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className="flex-1 pt-4 md:pt-6">
          {/* Stars */}
          {current.stars && (
            <div
              className={`flex gap-1 mb-4 transition-all duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < current.stars! ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
                />
              ))}
            </div>
          )}

          {/* Quote */}
          <blockquote
            className={`text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-foreground tracking-tight transition-all duration-300 ${
              isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            &ldquo;{current.quote}&rdquo;
          </blockquote>

          {/* Author */}
          <div
            className={`mt-8 group cursor-default transition-all duration-300 delay-100 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex items-center gap-4">
              {current.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.avatarUrl}
                  alt={current.author}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-foreground/10 group-hover:ring-foreground/30 grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-foreground/10 shrink-0">
                  <span className="text-sm font-bold text-primary">{current.author[0]}</span>
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{current.author}</p>
                <p className="text-sm text-muted-foreground">
                  {current.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {testimonials.map((_, index) => (
              <button key={index} onClick={() => handleChange(index)} className="group relative py-4">
                <span
                  className={`block h-px transition-all duration-500 ease-out ${
                    index === active
                      ? "w-12 bg-foreground"
                      : "w-6 bg-foreground/20 group-hover:w-8 group-hover:bg-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            {String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
