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
  UserPlus,
  Copy,
  Trash2,
  Shield,
  ShieldOff,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  Repeat,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Booking {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  sport: string
  status: string
  courtName: string
}

interface RecurringBooking {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  sport: string
  label: string | null
  courtName: string
  isActive: boolean
}

interface User {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  isAdmin: boolean
  isSuperAdmin: boolean
  createdAt: string
  totalSpent: number
  totalBookings: number
  regularBookings: number
  recurringBookingsCount: number
  recurringInstances: number
  recentBookings: Booking[]
  recurringBookings: RecurringBooking[]
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

  // Create account state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdUser, setCreatedUser] = useState<{ name: string; phone: string; password: string } | null>(null)

  // Delete account state
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Admin toggle state
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null)

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Expanded user state
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

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

  const handleCreateAccount = async () => {
    if (!newName || !newPhone) return

    setCreating(true)
    setCreateError('')

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCreatedUser({
          name: newName,
          phone: newPhone,
          password: data.defaultPassword,
        })
        setNewName('')
        setNewPhone('')
        setNewEmail('')
        fetchUsers()
      } else {
        setCreateError(data.error || t('failedToCreate'))
      }
    } catch (error) {
      console.error('Error creating account:', error)
      setCreateError(t('failedToCreate'))
    } finally {
      setCreating(false)
    }
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreatedUser(null)
    setNewName('')
    setNewPhone('')
    setNewEmail('')
    setCreateError('')
  }

  const copyCredentials = () => {
    if (createdUser) {
      navigator.clipboard.writeText(`Phone: ${createdUser.phone}\nPassword: ${createdUser.password}`)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletingUser) return

    setDeleting(true)

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deletingUser.id }),
      })

      if (res.ok) {
        setDeletingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || t('failedToDelete'))
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert(t('failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleAdmin = async (user: User) => {
    setTogglingAdmin(user.id)

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isAdmin: !user.isAdmin,
        }),
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || t('failedToUpdateAdmin'))
      }
    } catch (error) {
      console.error('Error toggling admin:', error)
      alert(t('failedToUpdateAdmin'))
    } finally {
      setTogglingAdmin(null)
    }
  }

  // Toggle selection for a user
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedUserIds(new Set())
    setSelectionMode(false)
  }

  // Check if user can be selected (not superadmin, not self)
  const canSelectUser = (user: User) => {
    return !user.isSuperAdmin && session?.user?.email !== user.email
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
      })

      const data = await res.json()

      if (res.ok) {
        setBulkDeleteConfirmOpen(false)
        clearSelections()
        fetchUsers()
        if (data.skipped && data.skipped.length > 0) {
          alert(`${data.deleted} user(s) deleted. Skipped: ${data.skipped.join(', ')}`)
        }
      } else {
        alert(data.error || t('failedToDelete'))
      }
    } catch (error) {
      console.error('Error bulk deleting accounts:', error)
      alert(t('failedToDelete'))
    } finally {
      setBulkDeleting(false)
    }
  }

  // Get selected users for display
  const selectedUsers = users.filter(u => selectedUserIds.has(u.id))

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
        <div className="flex gap-2">
          <Button
            variant={selectionMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (selectionMode) {
                clearSelections()
              } else {
                setSelectionMode(true)
              }
            }}
            className={selectionMode ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {selectionMode ? (
              <>
                <X className="w-4 h-4 mr-2" />
                {t('exitSelectMode')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('selectMode')}
              </>
            )}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            {t('createAccount')}
          </Button>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {tAdmin('refresh')}
          </Button>
        </div>
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
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.has(user.id)
                const canSelect = canSelectUser(user)
                const isExpanded = expandedUserId === user.id
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

                return (
                  <div
                    key={user.id}
                    className={`rounded-lg border transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-red-500 bg-red-50'
                        : isExpanded
                        ? 'bg-white ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Selection checkbox indicator */}
                    {selectionMode && canSelect && (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                        isSelected ? 'bg-red-500' : 'bg-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    )}
                    {selectionMode && !canSelect && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 bg-gray-200">
                        <ShieldCheck className="w-3 h-3 text-gray-500" />
                      </div>
                    )}

                    {/* Main card header - clickable */}
                    <div
                      className={`p-4 ${!selectionMode ? 'cursor-pointer' : ''} ${selectionMode && canSelect ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (selectionMode && canSelect) {
                          toggleUserSelection(user.id)
                        } else if (!selectionMode) {
                          setExpandedUserId(isExpanded ? null : user.id)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              #{user.uid}
                            </Badge>
                            <span className="font-medium text-gray-900">{user.name}</span>
                            {!selectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditUid(user)
                                }}
                                className="text-xs font-mono text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                              >
                                #{user.uid}
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            {user.isSuperAdmin && (
                              <Badge className="bg-purple-100 text-purple-700 border-0">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                {t('superAdmin')}
                              </Badge>
                            )}
                            {user.isAdmin && !user.isSuperAdmin && (
                              <Badge className="bg-green-100 text-green-700 border-0">
                                <Shield className="w-3 h-3 mr-1" />
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
                        <div className="text-right space-y-2">
                          <div className="flex gap-2 justify-end items-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {user.totalBookings} {t('bookings')}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              RM {user.totalSpent.toFixed(2)}
                            </Badge>
                            {!selectionMode && (
                              isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )
                            )}
                          </div>
                          {!selectionMode && !isExpanded && (
                            <div className="flex gap-2 justify-end">
                              {!user.isSuperAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleAdmin(user)
                                  }}
                                  disabled={togglingAdmin === user.id}
                                  className={user.isAdmin ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                                >
                                  {togglingAdmin === user.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : user.isAdmin ? (
                                    <>
                                      <ShieldOff className="w-4 h-4 mr-1" />
                                      {t('removeAdmin')}
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-4 h-4 mr-1" />
                                      {t('makeAdmin')}
                                    </>
                                  )}
                                </Button>
                              )}
                              {!user.isSuperAdmin && session?.user?.email !== user.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingUser(user)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  {t('deleteAccount')}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && !selectionMode && (
                      <div className="border-t px-4 pb-4 space-y-4">
                        {/* Stats summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-medium">{t('totalBookings')}</span>
                            </div>
                            <p className="text-xl font-bold text-blue-700">{user.totalBookings}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs font-medium">{t('totalSpent')}</span>
                            </div>
                            <p className="text-xl font-bold text-green-700">RM {user.totalSpent.toFixed(2)}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">{t('regularBookings')}</span>
                            </div>
                            <p className="text-xl font-bold text-purple-700">{user.regularBookings}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                              <Repeat className="w-4 h-4" />
                              <span className="text-xs font-medium">{t('recurringBookings')}</span>
                            </div>
                            <p className="text-xl font-bold text-orange-700">{user.recurringBookingsCount}</p>
                          </div>
                        </div>

                        {/* Recent bookings */}
                        {user.recentBookings && user.recentBookings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('recentBookings')}</h4>
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('date')}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('time')}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('court')}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('sport')}</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">{t('amount')}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {user.recentBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-100">
                                      <td className="px-3 py-2 text-gray-900">
                                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {booking.startTime} - {booking.endTime}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">{booking.courtName}</td>
                                      <td className="px-3 py-2">
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {booking.sport}
                                        </Badge>
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        RM {booking.totalAmount.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Recurring bookings */}
                        {user.recurringBookings && user.recurringBookings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('activeRecurring')}</h4>
                            <div className="grid gap-2">
                              {user.recurringBookings.filter(rb => rb.isActive).map((rb) => (
                                <div key={rb.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {dayNames[rb.dayOfWeek]}s
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      {rb.startTime} - {rb.endTime}
                                    </span>
                                    {rb.label && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {rb.label}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {rb.courtName} • {rb.sport}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons in expanded view */}
                        <div className="flex gap-2 justify-end pt-2 border-t">
                          {!user.isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleAdmin(user)
                              }}
                              disabled={togglingAdmin === user.id}
                              className={user.isAdmin ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                            >
                              {togglingAdmin === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.isAdmin ? (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-1" />
                                  {t('removeAdmin')}
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-1" />
                                  {t('makeAdmin')}
                                </>
                              )}
                            </Button>
                          )}
                          {!user.isSuperAdmin && session?.user?.email !== user.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingUser(user)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {t('deleteAccount')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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

      {/* Create Account Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              {t('createAccount')}
            </DialogTitle>
            <DialogDescription>
              {t('createAccountDescription')}
            </DialogDescription>
          </DialogHeader>

          {createdUser ? (
            // Success state - show credentials
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800 mb-2">{t('accountCreated')}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">{t('name')}:</span> <span className="font-medium">{createdUser.name}</span></p>
                  <p><span className="text-gray-600">{t('phone')}:</span> <span className="font-mono font-medium">{createdUser.phone}</span></p>
                  <p><span className="text-gray-600">{t('defaultPassword')}:</span> <span className="font-mono font-medium text-blue-600">{createdUser.password}</span></p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{t('shareCredentials')}</p>
              <DialogFooter>
                <Button variant="outline" onClick={copyCredentials}>
                  <Copy className="w-4 h-4 mr-2" />
                  {t('copyCredentials')}
                </Button>
                <Button onClick={closeCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                  {t('done')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Form state
            <>
              <div className="space-y-4 py-4">
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {createError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newName">{t('name')} *</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhone">{t('phone')} *</Label>
                  <Input
                    id="newPhone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="012-345 6789"
                  />
                  <p className="text-xs text-gray-500">{t('phoneFormat')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">{t('email')} ({t('optional')})</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  {t('defaultPasswordNote')}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreateDialog}>
                  {tAdmin('cancel')}
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  disabled={creating || !newName || !newPhone}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {t('create')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('deleteAccount')}
            </DialogTitle>
            <DialogDescription>
              {t('deleteConfirm')}
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-gray-900">{deletingUser.name}</p>
                <p className="text-sm text-gray-500">{deletingUser.email}</p>
                <p className="text-sm text-gray-500">{deletingUser.phone}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {deletingUser._count.bookings} {t('bookings')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              {tAdmin('cancel')}
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('deleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Bar for Selection Mode */}
      {selectionMode && selectedUserIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">
            {selectedUserIds.size} {t('selected')}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteConfirmOpen(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t('deleteSelected')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelections}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('confirmBulkDeleteTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('confirmBulkDeleteDescription', { count: selectedUserIds.size })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg max-h-48 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-1 border-b border-red-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user._count.bookings} {t('bookings')}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-600 mt-2">
              {t('bulkDeleteWarning')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirmOpen(false)}>
              {tAdmin('cancel')}
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('deleteAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
