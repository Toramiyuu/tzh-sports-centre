import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Calendar, Users, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function AdminPage() {
  const session = await auth()
  const t = await getTranslations('admin')

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  if (!isAdmin(session.user.email)) {
    redirect('/')
  }

  const adminFeatures = [
    {
      titleKey: 'bookingsLessons.title',
      descriptionKey: 'bookingsLessons.description',
      icon: Calendar,
      href: '/admin/bookings-lessons',
      color: 'bg-teal-100 text-teal-600',
    },
    {
      titleKey: 'membersAccounts.title',
      descriptionKey: 'membersAccounts.description',
      icon: Users,
      href: '/admin/members-accounts',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      titleKey: 'trainingOrders.title',
      descriptionKey: 'trainingOrders.description',
      icon: Wrench,
      href: '/admin/stringing',
      color: 'bg-cyan-100 text-cyan-600',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('welcome', { name: session.user.name || '' })}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminFeatures.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                    <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
