'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  CalendarDays,
  GraduationCap,
  Settings,
  Loader2,
  CreditCard
} from 'lucide-react'
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab'
import { BookingsTab } from '@/components/profile/BookingsTab'
import { LessonsTab } from '@/components/profile/LessonsTab'
import { SettingsTab } from '@/components/profile/SettingsTab'
import { SkeletonProfile } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

type TabType = 'personal' | 'bookings' | 'lessons' | 'settings'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  emergencyContact: string | null
  creditBalance: number
  createdAt: string
  isMember: boolean
  notifyBookingConfirm: boolean
  notifyBookingReminder: boolean
  notifyCancellation: boolean
  notifyLessonUpdates: boolean
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('profile')
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
      } else {
        console.error('Profile fetch failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonProfile />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  // Build tabs dynamically - only show Lessons tab for members
  const tabs = [
    { id: 'personal' as TabType, label: t('tabs.personal'), icon: User },
    { id: 'bookings' as TabType, label: t('tabs.bookings'), icon: CalendarDays },
    ...(profile?.isMember ? [{ id: 'lessons' as TabType, label: t('tabs.lessons'), icon: GraduationCap }] : []),
    { id: 'settings' as TabType, label: t('tabs.settings'), icon: Settings },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
            <p className="text-gray-600">{profile?.email}</p>
          </div>
        </div>

        {/* Credit Balance */}
        {profile && profile.creditBalance > 0 && (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
            <CreditCard className="w-4 h-4" />
            <span className="font-medium">{t('credits.balance')}: RM{profile.creditBalance.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'personal' && (
          profile ? (
            <PersonalInfoTab profile={profile} onUpdate={fetchProfile} />
          ) : (
            <div className="text-center py-8 text-gray-500">{t('loadingProfile')}</div>
          )
        )}
        {activeTab === 'bookings' && (
          <BookingsTab creditBalance={profile?.creditBalance || 0} onCreditUpdate={fetchProfile} />
        )}
        {activeTab === 'lessons' && profile?.isMember && (
          <LessonsTab />
        )}
        {activeTab === 'settings' && (
          profile ? (
            <SettingsTab profile={profile} onUpdate={fetchProfile} />
          ) : (
            <div className="text-center py-8 text-gray-500">{t('loadingSettings')}</div>
          )
        )}
      </div>
    </div>
  )
}
