'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  Loader2,
  Search,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Check,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface User {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  createdAt: string
  _count: {
    bookings: number
    recurringBookings: number
  }
}

export default function AdminAccountsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('admin.accountsList')
  const tAdmin = useTranslations('admin')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUid, setNewUid] = useState('')
  const [updating, setUpdating] = useState(false)
  const [uidError, setUidError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email)) {
      router.push('/')
    }
  }, [session, status, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/accounts')
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && isAdmin(session.user.email)) {
      fetchUsers()
    }
  }, [session])

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.uid.includes(query) ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query) ||
      user.uid.includes(query)
    )
  })

  const openEditUid = (user: User) => {
    setEditingUser(user)
    setNewUid(user.uid)
    setUidError('')
  }

  const handleUpdateUid = async () => {
    if (!editingUser || !newUid) return

    // Validate UID format
    if (!/^\d+$/.test(newUid)) {
      setUidError(t('uidMustBeNumber'))
      return
    }

    setUpdating(true)
    setUidError('')

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          newUid: newUid,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setEditingUser(null)
        setNewUid('')
        fetchUsers()
      } else {
        setUidError(data.error || t('failedToUpdateUid'))
      }
    } catch (error) {
      console.error('Error updating UID:', error)
      setUidError(t('failedToUpdateUid'))
    } finally {
      setUpdating(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tAdmin('back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('description')}</p>
          </div>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {tAdmin('refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-500">{t('totalUsers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((sum, u) => sum + u._count.bookings, 0)}
                </p>
                <p className="text-sm text-gray-500">{t('totalBookings')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(
                    (u) =>
                      new Date(u.createdAt) >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
                <p className="text-sm text-gray-500">{t('newThisWeek')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('users')}
            <Badge variant="secondary" className="ml-2">
              {filteredUsers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? t('noUsersMatch') : t('noUsersYet')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{user.uid}
                        </Badge>
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <button
                          onClick={() => openEditUid(user)}
                          className="text-xs font-mono text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          #{user.uid}
                          <Pencil className="w-3 h-3" />
                        </button>
                        {isAdmin(user.email) && (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            {t('admin')}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {t('registered')} {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {user._count.bookings} {t('bookings')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit UID Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-600" />
              {t('editUid')}
            </DialogTitle>
            <DialogDescription>
              {t('editUidDescription')}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{editingUser.name}</p>
                <p className="text-sm text-gray-500">{editingUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUid">{t('newUid')}</Label>
                <Input
                  id="newUid"
                  value={newUid}
                  onChange={(e) => {
                    setNewUid(e.target.value)
                    setUidError('')
                  }}
                  placeholder="100000001"
                  className="font-mono"
                />
                {uidError && (
                  <p className="text-sm text-red-600">{uidError}</p>
                )}
                <p className="text-xs text-gray-500">{t('uidHelp')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {tAdmin('cancel')}
            </Button>
            <Button
              onClick={handleUpdateUid}
              disabled={updating || !newUid || newUid === editingUser?.uid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {t('saveUid')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
