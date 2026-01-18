'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, CheckCircle2, ArrowRight } from 'lucide-react'
import { LessonTypeConfig, getPricePerPerson } from '@/lib/lesson-config'
import { useTranslations } from 'next-intl'

interface LessonDetailsModalProps {
  lesson: LessonTypeConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestTrial?: () => void
}

export function LessonDetailsModal({
  lesson,
  open,
  onOpenChange,
  onRequestTrial,
}: LessonDetailsModalProps) {
  const t = useTranslations('lessons')

  if (!lesson) return null

  const isMonthly = lesson.billingType === 'monthly'
  const prices = lesson.pricing as Record<number, number>
  const durations = isMonthly ? [] : Object.keys(prices).map(Number)

  // Get first duration's per-person price for display
  const firstDuration = durations[0]
  const perPersonPrice = getPricePerPerson(lesson.value, firstDuration)
  const totalPrice = isMonthly ? (lesson.pricing as number) : prices[firstDuration]

  const handleRequestTrial = () => {
    onOpenChange(false)
    onRequestTrial?.()
  }

  // Get translated lesson type label
  const lessonLabel = t(`types.${lesson.value}`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{lessonLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <p className="text-gray-600">
            {lesson.detailedDescription || lesson.description}
          </p>

          {/* Benefits */}
          {lesson.benefits && lesson.benefits.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">{t('modal.benefits')}</h4>
              <ul className="space-y-2">
                {lesson.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duration & Students */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              {isMonthly ? (
                <span>{lesson.sessionsPerMonth} {t('modal.sessionsPerMonth')}</span>
              ) : (
                <span>
                  {durations.length === 1
                    ? `${durations[0]} ${t('packages.hours')}`
                    : `${durations.join(' / ')} ${t('packages.hours')}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{t('packages.maxStudents', { count: lesson.maxStudents })}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3">{t('modal.pricing')}</h4>

            {isMonthly ? (
              <div className="text-2xl font-bold text-blue-600">
                RM{totalPrice}
                <span className="text-sm font-normal text-gray-500"> / {t('packages.perMonth')}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {durations.map((duration) => {
                  const price = prices[duration]
                  const ppPrice = getPricePerPerson(lesson.value, duration)
                  return (
                    <div key={duration} className="flex items-center justify-between">
                      <span className="text-gray-600">{duration} {t('packages.hours')}</span>
                      <div className="text-right">
                        {ppPrice && lesson.maxStudents > 1 ? (
                          <div>
                            <span className="text-lg font-bold text-blue-600">
                              RM{ppPrice}
                            </span>
                            <span className="text-sm text-gray-500"> / {t('modal.perPerson')}</span>
                            <div className="text-xs text-gray-400">
                              ({t('modal.total')}: RM{price})
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-blue-600">
                            RM{price}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Per-person highlight for group lessons */}
            {perPersonPrice && lesson.maxStudents > 1 && !isMonthly && (
              <div className="mt-3 pt-3 border-t">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {t('modal.perPersonValue', { price: perPersonPrice })}
                </Badge>
              </div>
            )}
          </div>

          {/* Trial Request Button */}
          {onRequestTrial && (
            <Button
              onClick={handleRequestTrial}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {t('modal.requestTrial')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
