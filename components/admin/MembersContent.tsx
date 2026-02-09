'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Mail,
  Phone,
  GraduationCap,
  RefreshCw,
  Star,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface User {
  id: string
  uid: string
  name: string
  email: string
  phone: string
  isMember: boolean
  skillLevel: string | null
  createdAt: string
  _count: {
    lessonSessions: number
  }
}

export default function MembersContent() {
  const { data: session, status } = useSession()
  const t = useTranslations('admin.membersList')
  const tAdmin = useTranslations('admin')

  const SKILL_LEVELS = [
    { value: 'beginner', label: t('beginner'), color: 'bg-green-900/50 text-green-400' },
    { value: 'intermediate', label: t('intermediate'), color: 'bg-blue-900/50 text-blue-400' },
    { value: 'advanced', label: t('advanced'), color: 'bg-purple-900/50 text-purple-400' },
  ]

  const [members, setMembers] = useState<User[]>([])
  const [nonMembers, setNonMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'members' | 'all'>('members')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/members')
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members || [])
        setNonMembers(data.nonMembers || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchUsers()
    }
  }, [session])

  const toggleMember = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isMember: !currentStatus }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error updating member:', error)
    } finally {
      setUpdating(null)
    }
  }

  const updateSkillLevel = async (userId: string, skillLevel: string) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillLevel }),
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error updating skill level:', error)
    } finally {
      setUpdating(null)
    }
  }

  const allUsers = [...members, ...nonMembers]
  const displayUsers = activeTab === 'members' ? members : allUsers

  const filteredUsers = displayUsers.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.uid.includes(query) ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query) ||
      user.uid.includes(query)
    )
  })

  const getSkillBadge = (skillLevel: string | null) => {
    const skill = SKILL_LEVELS.find(s => s.value === skillLevel)
    if (!skill) return null
    return (
      <Badge className={`${skill.color} border-0`}>
        {skill.label}
      </Badge>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-6">
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
              <div className="w-10 h-10 bg-[#2A76B0]/50 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#0a2540]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0a2540]">{members.length}</p>
                <p className="text-sm text-muted-foreground">{t('activeMembers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {members.reduce((sum, m) => sum + m._count.lessonSessions, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('totalLessons')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{allUsers.length}</p>
                <p className="text-sm text-muted-foreground">{t('totalRegisteredUsers')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'members' ? 'default' : 'outline'}
          onClick={() => setActiveTab('members')}
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          {t('membersTab')} ({members.length})
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >
          <Users className="w-4 h-4 mr-2" />
          {t('allUsersTab')} ({allUsers.length})
        </Button>
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
            {activeTab === 'members' ? (
              <GraduationCap className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
            {activeTab === 'members' ? t('membersTab') : t('allUsersTab')}
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
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery
                ? t('noUsersMatch')
                : activeTab === 'members'
                ? t('noMembersYet')
                : t('noUsersYet')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    user.isMember
                      ? 'bg-[#2A76B0]/20 border-[#1854d6]'
                      : 'bg-secondary border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{user.uid}
                        </Badge>
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs font-mono text-muted-foreground/70">#{user.uid}</span>
                        {user.isMember && (
                          <Badge className="bg-[#1854d6] text-white border-0">
                            {t('membersTab')}
                          </Badge>
                        )}
                        {user.isMember && getSkillBadge(user.skillLevel)}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          {user.phone}
                        </div>
                        {user.isMember && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-4 h-4 flex-shrink-0" />
                            {user._count.lessonSessions} {t('lessonsCompleted')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.isMember && (
                        <Select
                          value={user.skillLevel || ''}
                          onValueChange={(value) => updateSkillLevel(user.id, value)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-[140px] bg-card border-border">
                            <SelectValue placeholder={t('skillLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        variant={user.isMember ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleMember(user.id, user.isMember)}
                        disabled={updating === user.id}
                        className={user.isMember
                          ? 'text-red-400 border-red-800 hover:bg-red-900/30'
                          : 'bg-[#1854d6] hover:bg-[#1854d6]'
                        }
                      >
                        {updating === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.isMember ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            {t('remove')}
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            {t('addMember')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
