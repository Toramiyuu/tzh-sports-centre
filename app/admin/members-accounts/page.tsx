'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, UserCog, Loader2 } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

const MembersContent = dynamic(() => import('@/components/admin/MembersContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

const AccountsContent = dynamic(() => import('@/components/admin/AccountsContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

type TabType = 'members' | 'accounts'

function MembersAccountsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('admin')

  const urlTab = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(urlTab === 'accounts' ? 'accounts' : 'members')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      router.push('/')
    }
  }, [session, status, router])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    const url = tab === 'members' ? '/admin/members-accounts' : `/admin/members-accounts?tab=${tab}`
    router.push(url, { scroll: false })
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('membersAccounts.title')}</h1>
              <p className="text-muted-foreground">{t('membersAccounts.description')}</p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${
              activeTab === 'members'
                ? 'border-[#1854d6] text-[#0a2540]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleTabChange('members')}
          >
            <Users className="w-4 h-4 mr-2" />
            {t('membersAccounts.tabs.members')}
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${
              activeTab === 'accounts'
                ? 'border-[#1854d6] text-[#0a2540]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => handleTabChange('accounts')}
          >
            <UserCog className="w-4 h-4 mr-2" />
            {t('membersAccounts.tabs.accounts')}
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && <MembersContent />}
        {activeTab === 'accounts' && <AccountsContent />}
      </div>
    </div>
  )
}

export default function MembersAccountsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <MembersAccountsContent />
    </Suspense>
  )
}
