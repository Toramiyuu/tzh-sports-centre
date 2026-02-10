'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'tzh-cart'

function getCartKey(item: { productId: string; selectedSize?: string; selectedColor?: string }): string {
  return `${item.productId}-${item.selectedSize || ''}-${item.selectedColor || ''}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [])

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const key = getCartKey(item)
      const existingIndex = prev.findIndex(
        (i) => getCartKey(i) === key
      )

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      return [...prev, { ...item, quantity }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, selectedSize?: string, selectedColor?: string) => {
    const key = getCartKey({ productId, selectedSize, selectedColor })
    setItems((prev) => prev.filter((i) => getCartKey(i) !== key))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor)
      return
    }

    const key = getCartKey({ productId, selectedSize, selectedColor })
    setItems((prev) =>
      prev.map((i) =>
        getCartKey(i) === key ? { ...i, quantity } : i
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
