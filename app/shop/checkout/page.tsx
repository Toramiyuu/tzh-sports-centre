'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCart } from '@/components/shop/CartProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Switch } from '@/components/ui/switch'
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  User,
  CreditCard,
  Smartphone,
  Loader2,
  CheckCircle2,
  ImagePlus,
  X,
  Download,
  ArrowLeft,
  Banknote,
} from 'lucide-react'
import { toast } from 'sonner'

type PaymentMethod = 'tng' | 'duitnow' | 'cash'

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const t = useTranslations('shop.checkout')
  const tPayment = useTranslations('booking.paymentMethods')
  const tCommon = useTranslations('common')
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tng')
  const [hasPaid, setHasPaid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const total = getTotal()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-fill from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setCustomerName(session.user.name)
      if (session.user.email) setCustomerEmail(session.user.email)
    }
  }, [session])

  // Fetch phone from user profile if logged in
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/profile')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.phone) setCustomerPhone(data.phone)
        })
        .catch(() => {})
    }
  }, [session])

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidFileType'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'))
      return
    }

    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const removeReceipt = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview)
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      return data.url
    } catch (error) {
      console.error('Error uploading receipt:', error)
      return null
    }
  }

  const downloadQrCode = async (qrType: 'tng' | 'duitnow') => {
    const imagePath = qrType === 'tng' ? '/images/tng-qr.png' : '/images/duitnow-qr.png'
    const filename = qrType === 'tng' ? 'TZH-TouchNGo-QR.png' : 'TZH-DuitNow-QR.png'

    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(t('qrSaved'))
    } catch {
      toast.error(t('qrSaveFailed'))
    }
  }

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error(t('nameRequired'))
      return
    }
    if (!customerPhone.trim()) {
      toast.error(t('phoneRequired'))
      return
    }
    if (items.length === 0) {
      toast.error(t('cartEmpty'))
      return
    }
    if (paymentMethod !== 'cash' && !hasPaid) {
      toast.error(t('confirmPaymentFirst'))
      return
    }

    setSubmitting(true)

    try {
      // Upload receipt if provided
      let receiptUrl: string | null = null
      if (receiptFile && paymentMethod !== 'cash') {
        setUploadingReceipt(true)
        receiptUrl = await uploadReceipt(receiptFile)
        setUploadingReceipt(false)
        if (!receiptUrl) {
          toast.error(t('uploadFailed'))
          setSubmitting(false)
          return
        }
      }

      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || null,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
            selectedColor: item.selectedColor || null,
          })),
          paymentMethod,
          receiptUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || t('orderError'))
        return
      }

      // Clear cart and redirect to success
      clearCart()
      router.push(`/shop/checkout/success?orderId=${data.id}`)
    } catch {
      toast.error(t('orderError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f8ff] pt-24">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-20 h-20 text-[#0a2540]/20 mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-[#0a2540] mb-3">{t('emptyCart')}</h1>
          <p className="text-[#0a2540]/60 mb-8">{t('emptyCartHint')}</p>
          <Link href="/shop">
            <Button className="bg-[#1854d6] hover:bg-[#2060e0] text-white rounded-full px-8 py-6 text-base">
              {t('goShopping')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-[#0a2540]/60 hover:text-[#0a2540] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('backToShop')}
          </Link>
          <h1 className="text-3xl font-semibold text-[#0a2540]">{t('title')}</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Order Items + Customer Info + Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Items */}
            <div className="bg-[#EDF1FD] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">{t('orderSummary')}</h2>
              <div className="space-y-4">
                {items.map((item) => {
                  const itemKey = `${item.productId}-${item.selectedSize || ''}-${item.selectedColor || ''}`
                  return (
                    <div key={itemKey} className="flex gap-4 p-3 bg-white/60 rounded-xl">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
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
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#0a2540] line-clamp-1">{item.name}</h4>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-xs text-[#0a2540]/50 mt-0.5">
                            {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-[#0a2540] mt-1">RM{item.price.toFixed(0)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0a2540] hover:bg-[#f5f8ff] transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-[#0a2540]">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedSize, item.selectedColor)}
                              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0a2540] hover:bg-[#f5f8ff] transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[#0a2540]">
                              RM{(item.price * item.quantity).toFixed(0)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedColor)}
                              className="text-[#0a2540]/40 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-[#EDF1FD] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('customerInfo')}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-sm text-[#0a2540]">
                    {t('name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder={t('namePlaceholder')}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 bg-white border-[#0a2540]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-sm text-[#0a2540]">
                    {t('phone')} <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    id="customerPhone"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    className="mt-1 bg-white border-[#0a2540]/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-sm text-[#0a2540]">
                    {t('email')}
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 bg-white border-[#0a2540]/10"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-[#EDF1FD] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('paymentMethod')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => { setPaymentMethod('tng'); setHasPaid(false) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'tng'
                      ? 'border-[#1854d6] bg-[#1854d6]/5'
                      : 'border-[#0a2540]/10 bg-white hover:border-[#0a2540]/30'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#0a2540] mb-2" />
                  <p className="font-medium text-[#0a2540] text-sm">{tPayment('tng')}</p>
                </button>
                <button
                  onClick={() => { setPaymentMethod('duitnow'); setHasPaid(false) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'duitnow'
                      ? 'border-[#1854d6] bg-[#1854d6]/5'
                      : 'border-[#0a2540]/10 bg-white hover:border-[#0a2540]/30'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#0a2540] mb-2" />
                  <p className="font-medium text-[#0a2540] text-sm">{tPayment('duitnow')}</p>
                </button>
                <button
                  onClick={() => { setPaymentMethod('cash'); setHasPaid(false) }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-[#1854d6] bg-[#1854d6]/5'
                      : 'border-[#0a2540]/10 bg-white hover:border-[#0a2540]/30'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#0a2540] mb-2" />
                  <p className="font-medium text-[#0a2540] text-sm">{t('cashOnPickup')}</p>
                </button>
              </div>

              {/* Bank Transfer Payment Flow */}
              {paymentMethod !== 'cash' && (
                <div className="mt-6 space-y-4">
                  {/* Amount Banner */}
                  <div className="bg-[#1854d6] text-white rounded-xl p-4 text-center">
                    <p className="text-sm opacity-90">{t('amountToPay')}</p>
                    <p className="text-3xl font-bold">RM{total.toFixed(0)}</p>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1854d6] text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <h4 className="font-semibold text-[#0a2540]">{t('saveQrCode')}</h4>
                    </div>
                    <div className="flex justify-center">
                      <div className="p-3 bg-[#EDF1FD] rounded-lg border-2 border-[#0a2540]/10">
                        <img
                          src={paymentMethod === 'tng' ? '/images/tng-qr.png' : '/images/duitnow-qr.png'}
                          alt={`${paymentMethod === 'tng' ? tPayment('tng') : tPayment('duitnow')} QR Code`}
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `
                              <div class="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-[#EDF1FD] rounded-lg text-center p-4">
                                <p class="text-sm text-[#0a2540]/50">QR Code</p>
                              </div>
                            `
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base border-2 border-[#0a2540]/10 text-[#0a2540] hover:bg-[#EDF1FD]"
                      onClick={() => downloadQrCode(paymentMethod as 'tng' | 'duitnow')}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {t('saveQrToGallery')}
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    {[t('step2'), t('step3'), t('step4')].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <div className="w-7 h-7 bg-[#1854d6] text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {idx + 2}
                        </div>
                        <p className="text-sm text-[#0a2540]">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Receipt Upload */}
                  <div className="bg-white rounded-xl p-4 space-y-3 border border-[#0a2540]/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1854d6] text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h4 className="font-semibold text-[#0a2540]">{t('uploadReceipt')}</h4>
                        <p className="text-sm text-[#0a2540]/50">{t('uploadReceiptDesc')}</p>
                      </div>
                    </div>

                    {receiptPreview ? (
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="w-full max-h-48 object-contain rounded-lg border border-[#0a2540]/10"
                        />
                        <button
                          onClick={removeReceipt}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('receiptUploaded')}
                        </p>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-[#0a2540]/10 rounded-lg p-6 text-center hover:border-[#1854d6] hover:bg-[#EDF1FD]/50 transition-colors">
                          <ImagePlus className="w-10 h-10 mx-auto text-[#0a2540]/30 mb-2" />
                          <p className="text-sm font-medium text-[#0a2540]">{t('tapToUpload')}</p>
                          <p className="text-xs text-[#0a2540]/50 mt-1">{t('maxFileSize')}</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleReceiptSelect}
                        />
                      </label>
                    )}
                  </div>

                  {/* "I have paid" Toggle */}
                  <div className="bg-white border-2 border-[#1854d6]/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {hasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        <Label htmlFor="paid-toggle" className="text-base font-semibold text-[#0a2540] cursor-pointer">
                          {t('iHavePaid')}
                        </Label>
                      </div>
                      <Switch
                        id="paid-toggle"
                        checked={hasPaid}
                        onCheckedChange={setHasPaid}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                    <p className="text-xs text-[#0a2540]/50">
                      {t('confirmPaymentNote')}
                    </p>
                  </div>
                </div>
              )}

              {/* Cash on Pickup info */}
              {paymentMethod === 'cash' && (
                <div className="mt-6 bg-white rounded-xl p-4 border border-[#0a2540]/10">
                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-[#0a2540] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#0a2540]">{t('cashOnPickup')}</p>
                      <p className="text-sm text-[#0a2540]/50 mt-1">{t('cashPickupNote')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Total & Submit */}
          <div className="lg:col-span-2">
            <div className="bg-[#EDF1FD] rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">{t('orderTotal')}</h2>

              {/* Line items summary */}
              <div className="space-y-2 mb-4">
                {items.map((item) => {
                  const itemKey = `${item.productId}-${item.selectedSize || ''}-${item.selectedColor || ''}`
                  return (
                    <div key={itemKey} className="flex justify-between text-sm">
                      <span className="text-[#0a2540]/70 truncate mr-2">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-[#0a2540] font-medium flex-shrink-0">
                        RM{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[#0a2540]/10 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#0a2540]">{t('total')}</span>
                  <span className="text-2xl font-bold text-[#0a2540]">RM{total.toFixed(0)}</span>
                </div>
              </div>

              <Button
                className={`w-full rounded-full py-6 text-base font-semibold ${
                  (paymentMethod !== 'cash' && !hasPaid) || submitting
                    ? 'bg-[#0a2540]/20 cursor-not-allowed text-[#0a2540]/40'
                    : 'bg-[#1854d6] hover:bg-[#2060e0] text-white'
                }`}
                size="lg"
                onClick={handleSubmit}
                disabled={(paymentMethod !== 'cash' && !hasPaid) || submitting || uploadingReceipt}
              >
                {submitting || uploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadingReceipt ? t('uploadingReceipt') : t('placingOrder')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {t('placeOrder')}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-[#0a2540]/40 mt-3">
                {t('orderNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
