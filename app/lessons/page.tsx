'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Clock,
  BadgeCheck,
  Phone,
  GraduationCap,
  Star,
  Eye
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import TrialRequestForm from '@/components/TrialRequestForm'
import { LessonDetailsModal } from '@/components/LessonDetailsModal'
import {
  LESSON_TYPES,
  LessonTypeConfig,
  getPricePerPerson,
  getLessonPrice,
} from '@/lib/lesson-config'

// Split lesson types into private and group
const privateLessons = LESSON_TYPES.filter(
  t => t.billingType === 'per_session' && t.maxStudents <= 4 && t.value !== 'small-adult-group'
)
const groupLessons = LESSON_TYPES.filter(
  t => t.billingType === 'monthly' || t.value === 'small-adult-group'
)

// Popular lesson types
const popularLessons = ['1-to-2', 'large-kids']

function formatDuration(lesson: LessonTypeConfig): string {
  if (lesson.billingType === 'monthly') {
    return `${lesson.sessionsPerMonth} sessions/month`
  }
  if (lesson.allowedDurations.length === 1) {
    return `${lesson.allowedDurations[0]} hours`
  }
  return `${lesson.allowedDurations[0]}-${lesson.allowedDurations[lesson.allowedDurations.length - 1]} hours`
}

function getDisplayPrice(lesson: LessonTypeConfig): number {
  return getLessonPrice(lesson.value)
}

export default function LessonsPage() {
  const t = useTranslations('lessons')
  const [selectedLesson, setSelectedLesson] = useState<LessonTypeConfig | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const trialFormRef = useRef<HTMLDivElement>(null)

  const handleLessonClick = (lesson: LessonTypeConfig) => {
    setSelectedLesson(lesson)
    setModalOpen(true)
  }

  const handleRequestTrial = () => {
    // Scroll to trial form
    trialFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get translated lesson type label
  const getLessonLabel = (lessonValue: string) => {
    return t(`types.${lessonValue}`)
  }

  const renderLessonCard = (lesson: LessonTypeConfig, colorClass: string) => {
    const isPopular = popularLessons.includes(lesson.value)
    const price = getDisplayPrice(lesson)
    const perPersonPrice = getPricePerPerson(lesson.value)
    const isMonthly = lesson.billingType === 'monthly'

    return (
      <Card
        key={lesson.value}
        className={`relative border-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
          isPopular ? `border-${colorClass}-500` : 'border-gray-200'
        }`}
        onClick={() => handleLessonClick(lesson)}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className={`bg-${colorClass}-500 text-white`}>
              <Star className="w-3 h-3 mr-1" />
              {t('packages.popular')}
            </Badge>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className={`w-5 h-5 text-${colorClass}-500`} />
              <h3 className="font-semibold text-lg">{getLessonLabel(lesson.value)}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation()
                handleLessonClick(lesson)
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              {t('packages.viewDetails')}
            </Button>
          </div>

          <div className="mb-4">
            {/* Per-person pricing for group lessons */}
            {perPersonPrice && lesson.maxStudents > 1 && !isMonthly ? (
              <div>
                <span className="text-3xl font-bold text-gray-900">RM{perPersonPrice}</span>
                <span className="text-gray-500 text-sm"> / {t('packages.perPerson')}</span>
                <div className="text-xs text-gray-400 mt-1">
                  ({t('packages.total')}: RM{price})
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold text-gray-900">RM{price}</span>
                <span className="text-gray-500 text-sm">
                  {' '}/ {isMonthly ? t('packages.perMonth') : t('packages.perSession')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {formatDuration(lesson)}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              {lesson.maxStudents === 1
                ? t('packages.student')
                : t('packages.maxStudents', { count: lesson.maxStudents })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <Badge className="bg-white/20 text-white mb-4">
              <GraduationCap className="w-4 h-4 mr-1" />
              {t('coach.certification')}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              {t('subtitle')}
            </p>
            <a href="https://wa.me/601175758508" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Private Lesson Packages */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('packages.title')}
            </h2>
            <p className="text-gray-600">{t('packages.privateSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {privateLessons.map((lesson) => renderLessonCard(lesson, 'blue'))}
          </div>
        </div>
      </section>

      {/* Group Lesson Packages */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('packages.groupTitle')}
            </h2>
            <p className="text-gray-600">{t('packages.groupSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groupLessons.map((lesson) => renderLessonCard(lesson, 'green'))}
          </div>
        </div>
      </section>

      {/* Coach Credentials */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('coach.title')}
            </h2>

            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-md">
                <BadgeCheck className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{t('coach.certification')}</p>
                  <p className="text-sm text-gray-600">{t('coach.bam')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('features.courtBooking.title')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('features.courtBooking.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('features.shuttlecocks.title')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('features.shuttlecocks.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('features.trial.title')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('features.trial.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trial Request Form */}
      <section className="py-16 md:py-24" id="trial-form" ref={trialFormRef}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrialRequestForm />
        </div>
      </section>

      {/* Lesson Details Modal */}
      <LessonDetailsModal
        lesson={selectedLesson}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRequestTrial={handleRequestTrial}
      />
    </div>
  )
}
