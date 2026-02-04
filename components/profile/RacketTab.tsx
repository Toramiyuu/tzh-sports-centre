'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, X, Pencil, CircleDot, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface RacketProfile {
  id: string
  brand: string
  model: string
  weight: string
  shaftNumber: string | null
  tensionMain: number | null
  tensionCross: number | null
}

const RACKET_WEIGHTS = ['2U', '3U', '4U', '5U', '6U']

export function RacketTab() {
  const t = useTranslations('profile.racket')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [profile, setProfile] = useState<RacketProfile | null>(null)

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    weight: '',
    shaftNumber: '',
    tensionMain: '',
    tensionCross: '',
  })

  useEffect(() => {
    fetchRacketProfile()
  }, [])

  const fetchRacketProfile = async () => {
    try {
      const res = await fetch('/api/profile/racket')
      const data = await res.json()
      if (res.ok && data.racketProfile) {
        setProfile(data.racketProfile)
        setFormData({
          brand: data.racketProfile.brand || '',
          model: data.racketProfile.model || '',
          weight: data.racketProfile.weight || '',
          shaftNumber: data.racketProfile.shaftNumber || '',
          tensionMain: data.racketProfile.tensionMain?.toString() || '',
          tensionCross: data.racketProfile.tensionCross?.toString() || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch racket profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.brand || !formData.model || !formData.weight) {
      toast.error(t('requiredFields'))
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...formData,
        tensionMain: formData.tensionMain ? parseInt(formData.tensionMain) : null,
        tensionCross: formData.tensionCross ? parseInt(formData.tensionCross) : null,
      }

      const res = await fetch('/api/profile/racket', {
        method: profile ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || t('saveFailed'))
        return
      }

      toast.success(t('saveSuccess'))
      setProfile(data.racketProfile)
      setEditing(false)
    } catch (err) {
      toast.error(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        brand: profile.brand || '',
        model: profile.model || '',
        weight: profile.weight || '',
        shaftNumber: profile.shaftNumber || '',
        tensionMain: profile.tensionMain?.toString() || '',
        tensionCross: profile.tensionCross?.toString() || '',
      })
    } else {
      setFormData({
        brand: '',
        model: '',
        weight: '',
        shaftNumber: '',
        tensionMain: '',
        tensionCross: '',
      })
    }
    setEditing(false)
  }

  const handleCopyForCheckout = async () => {
    if (!profile) return

    const tensionStr = profile.tensionMain && profile.tensionCross
      ? `${t('tension')}: ${profile.tensionMain} x ${profile.tensionCross} lbs`
      : null

    const checkoutInfo = [
      `${t('brand')}: ${profile.brand}`,
      `${t('model')}: ${profile.model}`,
      tensionStr,
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(checkoutInfo)
      setCopied(true)
      toast.success(t('copiedToClipboard'))
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error(t('copyFailed'))
    }
  }

  if (loading) {
    return (
      <Card className="border border-neutral-200 rounded-2xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </CardContent>
      </Card>
    )
  }

  // If no profile exists and not editing, show setup prompt
  if (!profile && !editing) {
    return (
      <Card className="border border-neutral-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-900">
            <CircleDot className="w-5 h-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-neutral-500 mb-4">{t('noProfile')}</p>
          <Button onClick={() => setEditing(true)} className="bg-neutral-900 hover:bg-neutral-800 rounded-full">
            {t('addRacket')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-neutral-200 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-neutral-900">
          <CircleDot className="w-5 h-5" />
          {t('title')}
        </CardTitle>
        {!editing && profile && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyForCheckout} className="rounded-full">
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? t('copied') : t('copyForCheckout')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-full">
              <Pencil className="w-4 h-4 mr-2" />
              {t('edit')}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Racket Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="flex items-center justify-between text-neutral-700">
              {t('brand')}
              <span className="text-xs text-neutral-500">{t('required')}</span>
            </Label>
            {editing ? (
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t('brandPlaceholder')}
                className="rounded-lg border-neutral-200"
              />
            ) : (
              <p className="text-neutral-900 py-2">{profile?.brand}</p>
            )}
          </div>

          {/* Racket Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center justify-between text-neutral-700">
              {t('model')}
              <span className="text-xs text-neutral-500">{t('required')}</span>
            </Label>
            {editing ? (
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder={t('modelPlaceholder')}
                className="rounded-lg border-neutral-200"
              />
            ) : (
              <p className="text-neutral-900 py-2">{profile?.model}</p>
            )}
          </div>

          {/* Racket Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center justify-between text-neutral-700">
              {t('weight')}
              <span className="text-xs text-neutral-500">{t('required')}</span>
            </Label>
            {editing ? (
              <Select
                value={formData.weight}
                onValueChange={(value) => setFormData({ ...formData, weight: value })}
              >
                <SelectTrigger className="rounded-lg border-neutral-200">
                  <SelectValue placeholder={t('weightPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {RACKET_WEIGHTS.map((weight) => (
                    <SelectItem key={weight} value={weight}>
                      {weight} ({getWeightGrams(weight)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-neutral-900 py-2">
                {profile?.weight} ({getWeightGrams(profile?.weight || '')})
              </p>
            )}
          </div>

          {/* Shaft Number */}
          <div className="space-y-2">
            <Label htmlFor="shaftNumber" className="text-neutral-700">
              {t('shaftNumber')}
            </Label>
            {editing ? (
              <Input
                id="shaftNumber"
                value={formData.shaftNumber}
                onChange={(e) => setFormData({ ...formData, shaftNumber: e.target.value })}
                placeholder={t('shaftNumberPlaceholder')}
                className="rounded-lg border-neutral-200"
              />
            ) : (
              <p className="text-neutral-900 py-2">
                {profile?.shaftNumber || <span className="text-neutral-400">{t('notSet')}</span>}
              </p>
            )}
          </div>

          {/* Tension (Main x Cross) */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-neutral-700">{t('tension')}</Label>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  id="tensionMain"
                  type="number"
                  min={18}
                  max={35}
                  value={formData.tensionMain}
                  onChange={(e) => setFormData({ ...formData, tensionMain: e.target.value })}
                  placeholder={t('tensionMainPlaceholder')}
                  className="w-24 rounded-lg border-neutral-200"
                />
                <span className="text-neutral-500 font-medium">x</span>
                <Input
                  id="tensionCross"
                  type="number"
                  min={18}
                  max={35}
                  value={formData.tensionCross}
                  onChange={(e) => setFormData({ ...formData, tensionCross: e.target.value })}
                  placeholder={t('tensionCrossPlaceholder')}
                  className="w-24 rounded-lg border-neutral-200"
                />
                <span className="text-neutral-500">lbs</span>
              </div>
            ) : (
              <p className="text-neutral-900 py-2">
                {profile?.tensionMain && profile?.tensionCross ? (
                  `${profile.tensionMain} x ${profile.tensionCross} lbs`
                ) : (
                  <span className="text-neutral-400">{t('notSet')}</span>
                )}
              </p>
            )}
            <p className="text-xs text-neutral-500">{t('tensionHint')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800 rounded-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="rounded-full">
              <X className="w-4 h-4 mr-2" />
              {t('cancel')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get weight range in grams
function getWeightGrams(weight: string): string {
  const ranges: Record<string, string> = {
    '2U': '90-94g',
    '3U': '85-89g',
    '4U': '80-84g',
    '5U': '75-79g',
    '6U': '70-74g',
  }
  return ranges[weight] || ''
}
