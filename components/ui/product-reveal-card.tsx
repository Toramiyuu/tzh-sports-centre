"use client"

import { motion, useReducedMotion } from "motion/react"
import { buttonVariants } from "@/components/ui/button"
import { Eye, Star, Heart } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ProductRevealCardProps {
  name?: string
  price?: string
  originalPrice?: string
  image?: string
  description?: string
  rating?: number
  reviewCount?: number
  brand?: string
  badge?: string
  badgeVariant?: "primary" | "muted"
  colors?: string[]
  ctaLabel?: string
  onAdd?: () => void
  onCtaClick?: () => void
  onFavorite?: () => void
  enableAnimations?: boolean
  className?: string
}

export function ProductRevealCard({
  name = "Premium Wireless Headphones",
  price = "$199",
  originalPrice,
  image = "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=600&fit=crop",
  description,
  rating,
  reviewCount,
  brand,
  badge,
  badgeVariant = "primary",
  colors,
  ctaLabel = "View Details",
  onAdd,
  onCtaClick,
  onFavorite,
  enableAnimations = true,
  className,
}: ProductRevealCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = enableAnimations && !shouldReduceMotion

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    onFavorite?.()
  }

  const containerVariants = {
    rest: {
      scale: 1,
      y: 0,
      filter: "blur(0px)",
    },
    hover: shouldAnimate ? {
      scale: 1.03,
      y: -8,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }
    } : {},
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.1 },
  }

  const overlayVariants = {
    rest: {
      y: "100%",
      opacity: 0,
      filter: "blur(4px)",
    },
    hover: {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const contentVariants = {
    rest: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    hover: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  }

  const buttonVariants_motion = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate ? {
      scale: 1.05,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    } : {},
    tap: shouldAnimate ? { scale: 0.95 } : {},
  }

  const favoriteVariants = {
    rest: { scale: 1, rotate: 0 },
    favorite: {
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    },
  }

  const discountPercent = originalPrice
    ? Math.round(
        ((parseFloat(originalPrice.replace(/[^0-9.]/g, "")) -
          parseFloat(price.replace(/[^0-9.]/g, ""))) /
          parseFloat(originalPrice.replace(/[^0-9.]/g, ""))) *
          100
      )
    : 0

  return (
    <motion.div
      data-slot="product-reveal-card"
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "relative rounded-2xl border border-border/50 bg-card text-card-foreground overflow-hidden",
        "shadow-lg shadow-black/5 cursor-pointer group h-full",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden" onClick={onCtaClick}>
        <motion.img
          src={image}
          alt={name}
          className="h-56 w-full object-cover"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Favorite Button */}
        {onFavorite && (
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleFavorite(); }}
            variants={favoriteVariants}
            animate={isFavorite ? "favorite" : "rest"}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm border border-white/20",
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </motion.button>
        )}

        {/* Badge (Featured / Out of Stock / Discount) */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold",
              badgeVariant === "primary"
                ? "bg-primary text-white"
                : "bg-background/80 text-muted-foreground border border-border backdrop-blur-sm"
            )}
          >
            {badge}
          </motion.div>
        )}

        {/* Discount Badge (from originalPrice) */}
        {!badge && originalPrice && discountPercent > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
          >
            {discountPercent}% OFF
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-2">
        {/* Brand */}
        {brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {brand}
          </p>
        )}

        {/* Rating */}
        {rating != null && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-current"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            {reviewCount != null && (
              <span className="text-xs text-muted-foreground">
                {rating} ({reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight tracking-tight line-clamp-2 text-foreground">
            {name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{price}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Colors */}
        {colors && colors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {colors.length} {colors.length === 1 ? "color" : "colors"}
          </p>
        )}
      </div>

      {/* Reveal Overlay */}
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-background/96 backdrop-blur-xl flex flex-col justify-end"
      >
        <div className="p-6 space-y-4">
          {/* Product Description */}
          {description && (
            <motion.div variants={contentVariants}>
              <h4 className="font-semibold mb-2 text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {description}
              </p>
            </motion.div>
          )}

          {/* Colors in overlay */}
          {colors && colors.length > 0 && (
            <motion.div variants={contentVariants}>
              <p className="text-xs text-muted-foreground mb-2">Available colors</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="text-xs bg-muted/50 rounded-full px-2.5 py-1 text-muted-foreground"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Price in overlay */}
          <motion.div variants={contentVariants}>
            <div className="flex items-center gap-2">
              {brand && (
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {brand}
                </span>
              )}
              <span className="text-2xl font-bold text-primary">{price}</span>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div variants={contentVariants} className="space-y-2">
            <motion.button
              onClick={(e) => { e.stopPropagation(); (onCtaClick || onAdd)?.(); }}
              variants={buttonVariants_motion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-11 font-medium",
                "bg-gradient-to-r from-primary to-primary/90",
                "hover:from-primary/90 hover:to-primary",
                "shadow-lg shadow-primary/25"
              )}
            >
              <Eye className="w-4 h-4 mr-2" />
              {ctaLabel}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
