'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useCart } from '@/components/shop/CartProvider'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'

export function CartDrawer() {
  const t = useTranslations('shop.cart')
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, getTotal, getItemCount } = useCart()

  const itemCount = getItemCount()
  const total = getTotal()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md bg-background">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {t('title')} ({itemCount})
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('title')}
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-2">{t('empty')}</p>
            <p className="text-muted-foreground text-sm mb-6">{t('emptyHint')}</p>
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full px-6"
            >
              {t('continueShopping')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
              {items.map((item) => {
                const itemKey = `${item.productId}-${item.selectedSize || ''}-${item.selectedColor || ''}`
                return (
                  <div
                    key={itemKey}
                    className="flex gap-3 p-3 bg-card rounded-xl border border-border"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/shop/placeholder.jpg'
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {item.name}
                      </h4>

                      {/* Variants */}
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                        </p>
                      )}

                      <p className="text-sm font-semibold text-foreground mt-1">
                        RM{item.price.toFixed(0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.selectedSize, item.selectedColor)
                            }
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.selectedSize, item.selectedColor)
                            }
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-border transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.productId, item.selectedSize, item.selectedColor)
                          }
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('subtotal')}</span>
                <span className="text-lg font-bold text-foreground">RM{total.toFixed(0)}</span>
              </div>

              {/* Checkout Button */}
              <Link href="/shop/checkout" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full py-6 text-base">
                  {t('checkout')}
                </Button>
              </Link>

              {/* Continue Shopping */}
              <Button
                variant="outline"
                className="w-full rounded-full border-border text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {t('continueShopping')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
