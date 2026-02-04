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
import Image from 'next/image'
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
        className={`relative bg-white border cursor-pointer hover-lift ${
          isPopular ? 'border-neutral-900' : 'border-neutral-200'
        }`}
        onClick={() => handleLessonClick(lesson)}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-neutral-900 text-white">
              <Star className="w-3 h-3 mr-1" />
              {t('packages.popular')}
            </Badge>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-400" />
              <h3 className="font-semibold text-lg text-neutral-900">{getLessonLabel(lesson.value)}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-900"
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
                <span className="text-3xl font-bold text-neutral-900">RM{perPersonPrice}</span>
                <span className="text-neutral-500 text-sm"> / {t('packages.perPerson')}</span>
                <div className="text-xs text-neutral-400 mt-1">
                  ({t('packages.total')}: RM{price})
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold text-neutral-900">RM{price}</span>
                <span className="text-neutral-500 text-sm">
                  {' '}/ {isMonthly ? t('packages.perMonth') : t('packages.perSession')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              {formatDuration(lesson)}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-400" />
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
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              {t('coach.certification')}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-forwards">
              {t('title')}
            </h1>
            <p className="text-xl text-neutral-500 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-forwards">
              {t('subtitle')}
            </p>
            <a href="https://wa.me/601175758508" target="_blank" rel="noopener noreferrer" className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards inline-block">
              <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full h-12 px-6">
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Private Lesson Packages */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t('packages.title')}
            </h2>
            <p className="text-neutral-500">{t('packages.privateSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {privateLessons.map((lesson) => renderLessonCard(lesson, 'neutral'))}
          </div>
        </div>
      </section>

      {/* Group Lesson Packages */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4">
              {t('packages.groupTitle')}
            </h2>
            <p className="text-neutral-500">{t('packages.groupSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groupLessons.map((lesson) => renderLessonCard(lesson, 'neutral'))}
          </div>
        </div>
      </section>

      {/* Coach Credentials */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4 animate-in fade-in duration-700 fill-mode-forwards">
              {t('coach.title')}
            </h2>
            <p className="text-neutral-500 text-lg mb-8 animate-in fade-in duration-700 delay-100 fill-mode-forwards">
              {t('coach.bio')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <div className="flex items-center gap-3 bg-white border border-neutral-200 px-6 py-4 rounded-2xl hover-lift animate-in fade-in slide-in-from-left-4 duration-500 delay-200 fill-mode-forwards">
                <BadgeCheck className="w-8 h-8 text-neutral-400" />
                <div className="text-left">
                  <p className="font-semibold text-neutral-900">{t('coach.certification')}</p>
                  <p className="text-sm text-neutral-500">{t('coach.bam')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white border border-neutral-200 px-6 py-4 rounded-2xl hover-lift animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-forwards">
                <Users className="w-8 h-8 text-neutral-400" />
                <div className="text-left">
                  <p className="font-semibold text-neutral-900">{t('coach.experienceYears')}</p>
                  <p className="text-sm text-neutral-500">{t('coach.experienceDesc')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleRequestTrial()}
              className="mt-8 inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors animate-in fade-in duration-500 delay-300 fill-mode-forwards"
            >
              {t('coach.bookTrial')}
            </button>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-2">{t('features.courtBooking.title')}</h3>
                <p className="text-neutral-500 text-sm">
                  {t('features.courtBooking.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-forwards">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-2">{t('features.shuttlecocks.title')}</h3>
                <p className="text-neutral-500 text-sm">
                  {t('features.shuttlecocks.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-neutral-200 hover-lift animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-forwards">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-6 h-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-2">{t('features.trial.title')}</h3>
                <p className="text-neutral-500 text-sm">
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
