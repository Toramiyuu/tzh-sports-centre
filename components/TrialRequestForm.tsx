'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle, Loader2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

const lessonTypeOptions = [
  { value: '1-to-1', label: '1-to-1 Private' },
  { value: '1-to-2', label: '1-to-2' },
  { value: '1-to-3', label: '1-to-3' },
  { value: '1-to-4', label: '1-to-4' },
  { value: 'small-kids-beginners', label: 'Small Group Kids (Beginners)' },
  { value: 'large-kids', label: 'Large Group Kids' },
  { value: 'large-kids-intermediate', label: 'Large Group Kids (Intermediate)' },
  { value: 'small-adult-group', label: 'Small Adult Group' },
]

const timeOptions = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
]

export default function TrialRequestForm() {
  const t = useTranslations('lessons.trial')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredLessonType: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/trial-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            {t('successTitle')}
          </h3>
          <p className="text-green-700">
            {t('successMessage')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-teal-100">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900">
          {t('title')}
        </CardTitle>
        <p className="text-gray-600 mt-2">
          {t('subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('namePlaceholder')}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')} *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="012-345 6789"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            {/* Lesson Type */}
            <div className="space-y-2">
              <Label>{t('lessonType')} *</Label>
              <Select
                value={formData.preferredLessonType}
                onValueChange={(value) => handleChange('preferredLessonType', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLessonType')} />
                </SelectTrigger>
                <SelectContent>
                  {lessonTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Preferred Date */}
            <div className="space-y-2">
              <Label htmlFor="preferredDate">{t('preferredDate')}</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleChange('preferredDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Preferred Time */}
            <div className="space-y-2">
              <Label>{t('preferredTime')}</Label>
              <Select
                value={formData.preferredTime}
                onValueChange={(value) => handleChange('preferredTime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTime')} />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">{t('message')}</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('submit')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
