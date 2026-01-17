'use client'

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
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import TrialRequestForm from '@/components/TrialRequestForm'

const privateLesson = [
  {
    name: '1-to-1 Private',
    price: 130,
    priceLabel: 'RM130',
    duration: '1.5 hours',
    students: 1,
    popular: false,
    billingType: 'per_session' as const,
  },
  {
    name: '1-to-2',
    price: 160,
    priceLabel: 'RM160',
    duration: '1.5 hours',
    students: 2,
    popular: true,
    billingType: 'per_session' as const,
  },
  {
    name: '1-to-3',
    price: 180,
    priceLabel: 'RM180',
    duration: '2 hours',
    students: 3,
    popular: false,
    billingType: 'per_session' as const,
  },
  {
    name: '1-to-4',
    price: 200,
    priceLabel: 'RM200',
    duration: '2 hours',
    students: 4,
    popular: false,
    billingType: 'per_session' as const,
  },
]

const groupLessons = [
  {
    name: 'Small Group Kids (Beginners)',
    price: 50,
    priceLabel: 'RM50',
    duration: '4 sessions/month',
    students: 6,
    popular: false,
    billingType: 'monthly' as const,
  },
  {
    name: 'Large Group Kids',
    price: 100,
    priceLabel: 'RM100',
    duration: '4 sessions/month',
    students: 12,
    popular: true,
    billingType: 'monthly' as const,
  },
  {
    name: 'Large Group Kids (Intermediate)',
    price: 140,
    priceLabel: 'RM140',
    duration: '4 sessions/month',
    students: 12,
    popular: false,
    billingType: 'monthly' as const,
  },
  {
    name: 'Small Adult Group',
    price: 50,
    priceLabel: 'RM50',
    duration: '2 hours',
    students: 6,
    popular: false,
    billingType: 'per_session' as const,
  },
]

export default function LessonsPage() {
  const t = useTranslations('lessons')
  const tNav = useTranslations('nav')

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
            {privateLesson.map((lesson) => (
              <Card
                key={lesson.name}
                className={`relative border-2 ${lesson.popular ? 'border-blue-500' : 'border-gray-200'}`}
              >
                {lesson.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      {t('packages.popular')}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-lg">{lesson.name}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{lesson.priceLabel}</span>
                    <span className="text-gray-500 text-sm"> / {t('packages.perSession')}</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {lesson.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {lesson.students} {lesson.students === 1 ? t('packages.student') : t('packages.students')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            {groupLessons.map((lesson) => (
              <Card
                key={lesson.name}
                className={`relative border-2 ${lesson.popular ? 'border-green-500' : 'border-gray-200'}`}
              >
                {lesson.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      {t('packages.popular')}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-lg">{lesson.name}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{lesson.priceLabel}</span>
                    <span className="text-gray-500 text-sm"> / {lesson.billingType === 'monthly' ? t('packages.perMonth') : t('packages.perSession')}</span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {lesson.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {t('packages.maxStudents', { count: lesson.students })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      <section className="py-16 md:py-24" id="trial-form">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrialRequestForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('request.title')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a href="https://wa.me/601175758508" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp: 011-7575 8508
              </Button>
            </a>
            <Link href="/booking">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                {tNav('booking')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
