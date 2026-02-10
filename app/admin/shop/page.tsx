'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Package, ShoppingBag } from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const ShopContent = dynamic(() => import('@/components/admin/ShopContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

const ShopOrdersContent = dynamic(() => import('@/components/admin/ShopOrdersContent'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
})

function AdminShopContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
      router.push('/')
    }
  }, [session, status, router])

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
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === 'inventory' ? t('shopInventory.title') : t('shopOrders.title')}
              </h1>
              <p className="text-muted-foreground">
                {activeTab === 'inventory' ? t('shopInventory.description') : t('shopOrders.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'inventory'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="w-4 h-4" />
            {t('shopTabs.inventory')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'orders'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            {t('shopTabs.orders')}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'inventory' ? <ShopContent /> : <ShopOrdersContent />}
      </div>
    </div>
  )
}

export default function AdminShopPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <AdminShopContent />
    </Suspense>
  )
}
