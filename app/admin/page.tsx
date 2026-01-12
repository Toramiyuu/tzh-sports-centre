import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Calendar, Users, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  if (!isAdmin(session.user.email)) {
    redirect('/')
  }

  const adminFeatures = [
    {
      title: 'Manage Bookings',
      description: 'View, add, and cancel court bookings',
      icon: Calendar,
      href: '/admin/bookings',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Registered Accounts',
      description: 'View all registered users',
      icon: Users,
      href: '/admin/accounts',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Manage Members',
      description: 'Add or remove training students',
      icon: Users,
      href: '/admin/members',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Lesson Management',
      description: 'Schedule lessons and view billing',
      icon: GraduationCap,
      href: '/admin/lessons',
      color: 'bg-orange-100 text-orange-600',
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Welcome, {session.user.name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminFeatures.map((feature) => (
          <Link key={feature.href} href={feature.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
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
