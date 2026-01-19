'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/ui/phone-input'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  Download,
  Loader2,
  MessageCircle,
  Smartphone,
  User,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  getStringById,
  RACKET_BRANDS,
  BRAND_COLORS,
  DEFAULT_TENSION,
  StringProduct,
} from '@/lib/stringing-config'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const t = useTranslations('stringing')
  const tCommon = useTranslations('common')

  const stringId = searchParams.get('string')
  const colorParam = searchParams.get('color')
  const [selectedString, setSelectedString] = useState<StringProduct | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colorParam)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [racketModel, setRacketModel] = useState('')
  const [customRacket, setCustomRacket] = useState('')
  const [tensionMain, setTensionMain] = useState(DEFAULT_TENSION.main)
  const [tensionCross, setTensionCross] = useState(DEFAULT_TENSION.cross)
  const [pickupDate, setPickupDate] = useState<Date>(addDays(new Date(), 2))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Payment modal state
  const [showTngModal, setShowTngModal] = useState(false)
  const [tngHasPaid, setTngHasPaid] = useState(false)
  const [showDuitNowModal, setShowDuitNowModal] = useState(false)
  const [duitNowHasPaid, setDuitNowHasPaid] = useState(false)

  // Saved racket profile state
  const [savedRacketProfile, setSavedRacketProfile] = useState<{
    brand: string
    model: string
    tensionMain: number | null
    tensionCross: number | null
  } | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Load string data
  useEffect(() => {
    if (stringId) {
      const string = getStringById(stringId)
      if (string) {
        setSelectedString(string)
      } else {
        router.push('/stringing')
      }
    } else {
      router.push('/stringing')
    }
  }, [stringId, router])

  // Pre-fill user data if logged in
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  // Fetch saved racket profile if logged in
  useEffect(() => {
    const fetchRacketProfile = async () => {
      if (!session?.user) return

      setLoadingProfile(true)
      try {
        const res = await fetch('/api/profile/racket')
        if (res.ok) {
          const data = await res.json()
          if (data.racketProfile) {
            setSavedRacketProfile({
              brand: data.racketProfile.brand,
              model: data.racketProfile.model,
              tensionMain: data.racketProfile.tensionMain,
              tensionCross: data.racketProfile.tensionCross,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching racket profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchRacketProfile()
  }, [session])

  const isFormValid = () => {
    return (
      name.trim() !== '' &&
      phone.trim() !== '' &&
      (racketModel !== '' || customRacket.trim() !== '') &&
      tensionMain >= DEFAULT_TENSION.minTension &&
      tensionMain <= DEFAULT_TENSION.maxTension &&
      tensionCross >= DEFAULT_TENSION.minTension &&
      tensionCross <= DEFAULT_TENSION.maxTension &&
      pickupDate
    )
  }

  const applyRacketProfile = () => {
    if (!savedRacketProfile) return

    // Construct the racket model string (Brand + Model)
    const fullRacketModel = `${savedRacketProfile.brand} ${savedRacketProfile.model}`

    // Check if this model exists in our predefined list
    const matchingBrand = RACKET_BRANDS.find((b) =>
      b.models.some((m) => `${b.name} ${m}` === fullRacketModel)
    )

    if (matchingBrand) {
      setRacketModel(fullRacketModel)
      setCustomRacket('')
    } else {
      // Use "other" and put the full model name in custom input
      setRacketModel('other')
      setCustomRacket(fullRacketModel)
    }

    // Apply saved tension if available
    if (savedRacketProfile.tensionMain) {
      setTensionMain(savedRacketProfile.tensionMain)
    }
    if (savedRacketProfile.tensionCross) {
      setTensionCross(savedRacketProfile.tensionCross)
    }

    toast.success(t('checkout.racketProfileApplied'))
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
      toast.success('QR code saved to your device!')
    } catch (_err) {
      toast.error('Failed to download QR code')
    }
  }

  const handleSubmitOrder = async (paymentMethod: string, hasPaid: boolean) => {
    if (!selectedString || !isFormValid()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/stringing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stringId: selectedString.id,
          stringName: selectedString.fullName,
          stringColor: selectedColor || null,
          price: selectedString.price,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || null,
          racketModel: racketModel === 'other' ? customRacket.trim() : racketModel,
          racketModelCustom: racketModel === 'other' ? customRacket.trim() : null,
          tensionMain,
          tensionCross,
          pickupDate: format(pickupDate, 'yyyy-MM-dd'),
          notes: notes.trim() || null,
          paymentMethod,
          paymentUserConfirmed: hasPaid,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create order')
      }

      toast.success(t('checkout.orderSuccess'))
      setShowTngModal(false)
      setShowDuitNowModal(false)
      router.push('/stringing?success=true')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error(t('checkout.orderError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!selectedString) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const total = selectedString.price

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/stringing"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tCommon('back')}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('checkout.title')}
        </h1>

        <div className="grid gap-6">
          {/* Selected String Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('checkout.selectedString')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: BRAND_COLORS[selectedString.brand] || '#666' }}
                >
                  <Wrench className="w-8 h-8 text-white opacity-50" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{selectedString.brand}</p>
                  <p className="font-semibold text-lg">{selectedString.name}</p>
                  {selectedString.gauge && (
                    <p className="text-sm text-gray-500">{selectedString.gauge}</p>
                  )}
                  {selectedColor && (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: selectedColor.toLowerCase() }}
                      />
                      <span className="text-sm text-gray-600">{selectedColor}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">RM{selectedString.price}</p>
                  <Link href="/stringing" className="text-sm text-blue-600 hover:underline">
                    {t('checkout.changeString')}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('checkout.customerInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('checkout.name')} *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('checkout.namePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('checkout.phone')} *</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder={t('checkout.phonePlaceholder')}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('checkout.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('checkout.emailPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Racket Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('checkout.racketDetails')}</CardTitle>
                {savedRacketProfile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyRacketProfile}
                    disabled={loadingProfile}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('checkout.useSavedRacket')}
                  </Button>
                )}
              </div>
              {savedRacketProfile && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('checkout.savedRacketInfo', {
                    brand: savedRacketProfile.brand,
                    model: savedRacketProfile.model,
                  })}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Racket Model */}
              <div className="space-y-2">
                <Label>{t('checkout.racketModel')} *</Label>
                <Select value={racketModel} onValueChange={setRacketModel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('checkout.selectRacket')} />
                  </SelectTrigger>
                  <SelectContent>
                    {RACKET_BRANDS.map((brand) => (
                      <SelectGroup key={brand.name}>
                        <SelectLabel>{brand.name}</SelectLabel>
                        {brand.models.map((model) => (
                          <SelectItem key={`${brand.name}-${model}`} value={`${brand.name} ${model}`}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    <SelectGroup>
                      <SelectLabel>Other</SelectLabel>
                      <SelectItem value="other">{t('checkout.otherRacket')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Racket Input */}
              {racketModel === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="customRacket">{t('checkout.customRacket')} *</Label>
                  <Input
                    id="customRacket"
                    value={customRacket}
                    onChange={(e) => setCustomRacket(e.target.value)}
                    placeholder={t('checkout.customRacketPlaceholder')}
                    required
                  />
                </div>
              )}

              {/* Tension */}
              <div className="space-y-2">
                <Label>{t('checkout.tension')} *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="tensionMain" className="text-sm text-gray-500">
                      {t('checkout.tensionMain')}
                    </Label>
                    <Input
                      id="tensionMain"
                      type="number"
                      min={DEFAULT_TENSION.minTension}
                      max={DEFAULT_TENSION.maxTension}
                      value={tensionMain}
                      onChange={(e) => setTensionMain(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tensionCross" className="text-sm text-gray-500">
                      {t('checkout.tensionCross')}
                    </Label>
                    <Input
                      id="tensionCross"
                      type="number"
                      min={DEFAULT_TENSION.minTension}
                      max={DEFAULT_TENSION.maxTension}
                      value={tensionCross}
                      onChange={(e) => setTensionCross(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">{t('checkout.tensionHelp')}</p>
              </div>

              {/* Pickup Date */}
              <div className="space-y-2">
                <Label>{t('checkout.pickupDate')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !pickupDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pickupDate ? format(pickupDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={(date) => date && setPickupDate(date)}
                      disabled={(date) => date < addDays(new Date(), 1)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">{t('checkout.pickupDateHelp')}</p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('checkout.notes')}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('checkout.notesPlaceholder')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('checkout.payment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="font-medium">{t('checkout.total')}</span>
                <span className="text-2xl font-bold text-blue-600">RM{total}</span>
              </div>

              {/* Payment Buttons */}
              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 text-base border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowTngModal(true)}
                  disabled={!isFormValid()}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {t('payment.tng')}
                </Button>
                <Button
                  variant="outline"
                  className="h-14 text-base border-2 border-pink-600 text-pink-600 hover:bg-pink-50"
                  onClick={() => setShowDuitNowModal(true)}
                  disabled={!isFormValid()}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  {t('payment.duitnow')}
                </Button>
              </div>

              {!isFormValid() && (
                <p className="text-sm text-center text-orange-600">
                  {t('checkout.requiredField')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Touch 'n Go Payment Modal */}
      <Dialog open={showTngModal} onOpenChange={setShowTngModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-blue-600" />
              {t('payment.tng')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-blue-600 text-white rounded-xl p-4 text-center">
              <p className="text-sm opacity-90">{t('payment.amount')}</p>
              <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
            </div>

            {/* Step 1: Save QR Code */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h4 className="font-semibold text-gray-900">Save the QR Code</h4>
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                  <img
                    src="/images/tng-qr.png"
                    alt="Touch 'n Go QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-base border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => downloadQrCode('tng')}
              >
                <Download className="mr-2 h-5 w-5" />
                Save QR Code to Gallery
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-gray-900">Open Touch &apos;n Go App</p>
                  <p className="text-sm text-gray-600">Open your Touch &apos;n Go eWallet app</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-gray-900">Scan from Gallery</p>
                  <p className="text-sm text-gray-600">Tap &apos;Scan&apos;, then select the QR code from your gallery</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                <div>
                  <p className="font-medium text-gray-900">Enter Amount</p>
                  <p className="text-sm text-gray-600">Enter exactly <strong className="text-blue-600">RM{total.toFixed(2)}</strong></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">5</div>
                <div>
                  <p className="font-medium text-gray-900">Send Screenshot via WhatsApp</p>
                  <p className="text-sm text-gray-600 mb-2">Send your payment screenshot to:</p>
                  <a
                    href="https://wa.me/60116868508"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    011-6868 8508
                  </a>
                </div>
              </div>
            </div>

            {/* "I have paid" Toggle */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tngHasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  <Label htmlFor="tng-paid-toggle" className="text-base font-semibold text-gray-900 cursor-pointer">
                    {t('checkout.iHavePaid')}
                  </Label>
                </div>
                <Switch
                  id="tng-paid-toggle"
                  checked={tngHasPaid}
                  onCheckedChange={setTngHasPaid}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-xs text-yellow-800">
                {t('payment.afterPayment')}
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              className={`w-full h-14 text-lg font-semibold ${tngHasPaid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
              size="lg"
              onClick={() => handleSubmitOrder('tng', tngHasPaid)}
              disabled={!tngHasPaid || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                t('checkout.confirmOrder')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DuitNow Payment Modal */}
      <Dialog open={showDuitNowModal} onOpenChange={setShowDuitNowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-pink-600" />
              {t('payment.duitnow')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-pink-600 text-white rounded-xl p-4 text-center">
              <p className="text-sm opacity-90">{t('payment.amount')}</p>
              <p className="text-3xl font-bold">RM{total.toFixed(2)}</p>
            </div>

            {/* Step 1: Save QR Code */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h4 className="font-semibold text-gray-900">Save the QR Code</h4>
              </div>
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                  <img
                    src="/images/duitnow-qr.png"
                    alt="DuitNow QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-base border-2 border-pink-600 text-pink-600 hover:bg-pink-50"
                onClick={() => downloadQrCode('duitnow')}
              >
                <Download className="mr-2 h-5 w-5" />
                Save QR Code to Gallery
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-gray-900">Open Banking App</p>
                  <p className="text-sm text-gray-600">Open your banking app that supports DuitNow</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-gray-900">Scan QR Code</p>
                  <p className="text-sm text-gray-600">Select DuitNow QR and scan from gallery</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">4</div>
                <div>
                  <p className="font-medium text-gray-900">Enter Amount</p>
                  <p className="text-sm text-gray-600">Enter exactly <strong className="text-pink-600">RM{total.toFixed(2)}</strong></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">5</div>
                <div>
                  <p className="font-medium text-gray-900">Send Screenshot via WhatsApp</p>
                  <p className="text-sm text-gray-600 mb-2">Send your payment screenshot to:</p>
                  <a
                    href="https://wa.me/60116868508"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    011-6868 8508
                  </a>
                </div>
              </div>
            </div>

            {/* "I have paid" Toggle */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {duitNowHasPaid && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  <Label htmlFor="duitnow-paid-toggle" className="text-base font-semibold text-gray-900 cursor-pointer">
                    {t('checkout.iHavePaid')}
                  </Label>
                </div>
                <Switch
                  id="duitnow-paid-toggle"
                  checked={duitNowHasPaid}
                  onCheckedChange={setDuitNowHasPaid}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-xs text-yellow-800">
                {t('payment.afterPayment')}
              </p>
            </div>

            {/* Confirm Button */}
            <Button
              className={`w-full h-14 text-lg font-semibold ${duitNowHasPaid ? 'bg-pink-600 hover:bg-pink-700' : 'bg-gray-300 cursor-not-allowed'}`}
              size="lg"
              onClick={() => handleSubmitOrder('duitnow', duitNowHasPaid)}
              disabled={!duitNowHasPaid || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                t('checkout.confirmOrder')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StringingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
