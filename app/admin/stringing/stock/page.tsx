'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Edit3,
  History,
  Loader2,
  Minus,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { toast } from 'sonner'
import { STRING_INVENTORY, BRAND_COLORS, getStringById } from '@/lib/stringing-config'

interface StockRecord {
  id: string
  stringId: string
  color: string
  quantity: number
  lowStockAlert: number
  lastUpdatedBy: string | null
  createdAt: string
  updatedAt: string
}

interface StockLog {
  id: string
  stockId: string
  previousQty: number
  newQty: number
  changeType: string
  reason: string | null
  orderId: string | null
  changedBy: string | null
  createdAt: string
  stock: {
    stringId: string
    color: string
  }
}

// Common string colors
const COMMON_COLORS = [
  'White',
  'Black',
  'Red',
  'Blue',
  'Yellow',
  'Orange',
  'Green',
  'Pink',
  'Purple',
  'Gold',
  'Silver',
  'Navy',
]

export default function AdminStockPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [stockRecords, setStockRecords] = useState<StockRecord[]>([])
  const [logs, setLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStrings, setExpandedStrings] = useState<Set<string>>(new Set())

  // Edit color variant dialog
  const [selectedStock, setSelectedStock] = useState<StockRecord | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editLowAlert, setEditLowAlert] = useState(3)
  const [editReason, setEditReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Add color dialog
  const [addColorDialogOpen, setAddColorDialogOpen] = useState(false)
  const [addColorStringId, setAddColorStringId] = useState<string | null>(null)
  const [newColor, setNewColor] = useState('')
  const [newColorQuantity, setNewColorQuantity] = useState(10)
  const [addingColor, setAddingColor] = useState(false)

  // Logs dialog
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<StockRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk edit dialog
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [bulkEditQuantity, setBulkEditQuantity] = useState(10)
  const [bulkEditReason, setBulkEditReason] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  // Bulk delete dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const userIsAdmin = isAdmin(session?.user?.email, session?.user?.isAdmin)

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (!session?.user?.email || !userIsAdmin) {
      router.push('/admin')
      return
    }

    fetchStock()
    fetchLogs()
  }, [session, sessionStatus, userIsAdmin, router])

  const fetchStock = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stringing/stock')
      const data = await res.json()
      setStockRecords(data.stock || [])
    } catch (error) {
      console.error('Error fetching stock:', error)
      toast.error('Failed to load stock')
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/stringing/stock/logs?limit=50')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  // Get all color variants for a string
  const getColorsForString = (stringId: string): StockRecord[] => {
    return stockRecords.filter((s) => s.stringId === stringId)
  }

  // Calculate total stock for a string (sum of all colors)
  const getTotalStock = (stringId: string): number => {
    return getColorsForString(stringId).reduce((sum, s) => sum + s.quantity, 0)
  }

  // Toggle expanded state for a string
  const toggleExpanded = (stringId: string) => {
    setExpandedStrings((prev) => {
      const next = new Set(prev)
      if (next.has(stringId)) {
        next.delete(stringId)
      } else {
        next.add(stringId)
      }
      return next
    })
  }

  // Open add color dialog
  const openAddColorDialog = (stringId: string) => {
    setAddColorStringId(stringId)
    setNewColor('')
    setNewColorQuantity(10)
    setAddColorDialogOpen(true)
  }

  // Add new color variant
  const handleAddColor = async () => {
    if (!addColorStringId || !newColor.trim()) {
      toast.error('Please enter a color name')
      return
    }

    try {
      setAddingColor(true)
      const res = await fetch('/api/admin/stringing/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stringId: addColorStringId,
          color: newColor.trim(),
          quantity: newColorQuantity,
          lowStockAlert: 3,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || `Failed to add color (Status: ${res.status})`)
        return
      }

      toast.success(`Added ${newColor} color variant`)
      setAddColorDialogOpen(false)
      fetchStock()
      fetchLogs()

      // Expand the string to show the new color
      setExpandedStrings((prev) => new Set(prev).add(addColorStringId))
    } catch (error) {
      console.error('Error adding color:', error)
      toast.error('Network error - please try again')
    } finally {
      setAddingColor(false)
    }
  }

  // Open edit dialog for a color variant
  const openEditDialog = (stock: StockRecord) => {
    setSelectedStock(stock)
    setEditQuantity(stock.quantity)
    setEditLowAlert(stock.lowStockAlert)
    setEditReason('')
    setEditDialogOpen(true)
  }

  // Save stock changes
  const handleSaveStock = async () => {
    if (!selectedStock) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/stringing/stock/${selectedStock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editQuantity,
          lowStockAlert: editLowAlert,
          reason: editReason || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to update stock')

      toast.success('Stock updated successfully')
      setEditDialogOpen(false)
      fetchStock()
      fetchLogs()
    } catch (error) {
      console.error('Error saving stock:', error)
      toast.error('Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  // Quick adjust stock
  const quickAdjust = async (stock: StockRecord, delta: number) => {
    const newQty = Math.max(0, stock.quantity + delta)

    try {
      const res = await fetch(`/api/admin/stringing/stock/${stock.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQty,
          reason: delta > 0 ? 'Quick restock' : 'Quick adjustment',
        }),
      })

      if (!res.ok) throw new Error('Failed to update stock')

      toast.success(`Stock ${delta > 0 ? 'increased' : 'decreased'} to ${newQty}`)
      fetchStock()
      fetchLogs()
    } catch (error) {
      console.error('Error adjusting stock:', error)
      toast.error('Failed to update stock')
    }
  }

  // Delete color variant
  const handleDeleteColor = async () => {
    if (!stockToDelete) return

    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/stringing/stock/${stockToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete color')

      toast.success(`Deleted ${stockToDelete.color} variant`)
      setDeleteDialogOpen(false)
      setStockToDelete(null)
      fetchStock()
      fetchLogs()
    } catch (error) {
      console.error('Error deleting color:', error)
      toast.error('Failed to delete color')
    } finally {
      setDeleting(false)
    }
  }

  // Bulk selection helpers
  const toggleSelectMode = () => {
    setSelectMode(!selectMode)
    setSelectedIds(new Set())
  }

  const toggleSelectStock = (stockId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(stockId)) {
        next.delete(stockId)
      } else {
        next.add(stockId)
      }
      return next
    })
  }

  const selectAllInString = (stringId: string) => {
    const colors = getColorsForString(stringId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      colors.forEach((c) => next.add(c.id))
      return next
    })
  }

  const deselectAllInString = (stringId: string) => {
    const colors = getColorsForString(stringId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      colors.forEach((c) => next.delete(c.id))
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(stockRecords.map((s) => s.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const isStringFullySelected = (stringId: string): boolean => {
    const colors = getColorsForString(stringId)
    return colors.length > 0 && colors.every((c) => selectedIds.has(c.id))
  }

  const isStringPartiallySelected = (stringId: string): boolean => {
    const colors = getColorsForString(stringId)
    const selectedCount = colors.filter((c) => selectedIds.has(c.id)).length
    return selectedCount > 0 && selectedCount < colors.length
  }

  // Bulk edit handler
  const handleBulkEdit = async () => {
    if (selectedIds.size === 0) return

    try {
      setBulkSaving(true)
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/admin/stringing/stock/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: bulkEditQuantity,
            reason: bulkEditReason || 'Bulk update',
          }),
        })
      )

      await Promise.all(promises)

      toast.success(`Updated ${selectedIds.size} items`)
      setBulkEditDialogOpen(false)
      setBulkEditReason('')
      setSelectedIds(new Set())
      setSelectMode(false)
      fetchStock()
      fetchLogs()
    } catch (error) {
      console.error('Error bulk editing:', error)
      toast.error('Failed to update some items')
    } finally {
      setBulkSaving(false)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    try {
      setBulkDeleting(true)
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/admin/stringing/stock/${id}`, {
          method: 'DELETE',
        })
      )

      await Promise.all(promises)

      toast.success(`Deleted ${selectedIds.size} items`)
      setBulkDeleteDialogOpen(false)
      setSelectedIds(new Set())
      setSelectMode(false)
      fetchStock()
      fetchLogs()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      toast.error('Failed to delete some items')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Get selected stock details for display
  const getSelectedStocks = (): StockRecord[] => {
    return stockRecords.filter((s) => selectedIds.has(s.id))
  }

  // Calculate stats
  const stringsWithStock = new Set(stockRecords.map((s) => s.stringId))
  const stats = {
    totalStrings: STRING_INVENTORY.length,
    stringsWithColors: stringsWithStock.size,
    totalColorVariants: stockRecords.length,
    outOfStock: STRING_INVENTORY.filter((s) => {
      const colors = getColorsForString(s.id)
      return colors.length > 0 && colors.every((c) => c.quantity === 0)
    }).length,
    lowStock: stockRecords.filter((s) => s.quantity > 0 && s.quantity <= s.lowStockAlert).length,
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/stringing">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">String Stock Management</h1>
                <p className="text-sm text-muted-foreground">Manage inventory levels by color variant</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectMode ? 'default' : 'outline'}
                onClick={toggleSelectMode}
                className={selectMode ? 'bg-teal-600 hover:bg-teal-700' : ''}
              >
                {selectMode ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Exit Select
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setLogsDialogOpen(true)}>
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button variant="outline" onClick={() => { fetchStock(); fetchLogs(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Strings</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalStrings}</p>
                </div>
                <Package className="w-10 h-10 text-teal-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Color Variants</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.totalColorVariants}</p>
                </div>
                <Palette className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Colors</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-400">{stats.outOfStock}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Action Bar */}
        {selectMode && selectedIds.size > 0 && (
          <div className="sticky top-0 z-10 bg-teal-600 text-white rounded-lg shadow-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-teal-700"
                onClick={selectAll}
              >
                Select All ({stockRecords.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-teal-700"
                onClick={deselectAll}
              >
                Deselect All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setBulkEditQuantity(10)
                  setBulkEditReason('')
                  setBulkEditDialogOpen(true)
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Stock List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">String Inventory by Color</CardTitle>
              {selectMode && stockRecords.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedIds.size === stockRecords.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll()
                      } else {
                        deselectAll()
                      }
                    }}
                  />
                  <Label htmlFor="select-all" className="text-sm font-normal cursor-pointer">
                    Select all colors
                  </Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {STRING_INVENTORY.map((string) => {
                const colors = getColorsForString(string.id)
                const totalStock = getTotalStock(string.id)
                const hasColors = colors.length > 0
                const isExpanded = expandedStrings.has(string.id)
                const isOutOfStock = hasColors && totalStock === 0
                const hasLowStock = colors.some((c) => c.quantity > 0 && c.quantity <= c.lowStockAlert)

                return (
                  <Collapsible
                    key={string.id}
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(string.id)}
                  >
                    <div
                      className={`rounded-lg border ${
                        isOutOfStock
                          ? 'bg-red-900/20 border-red-800'
                          : hasLowStock
                          ? 'bg-yellow-900/20 border-yellow-800'
                          : 'bg-card border-border'
                      }`}
                    >
                      {/* String Header */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-card">
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground/70" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground/70" />
                            )}
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: BRAND_COLORS[string.brand] || '#666' }}
                            >
                              {string.brand.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{string.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                RM{string.price} • {string.gauge}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Total Stock */}
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total Stock</p>
                              <p className="text-xl font-bold text-foreground">{hasColors ? totalStock : '-'}</p>
                            </div>

                            {/* Colors Count */}
                            <div className="text-right min-w-[80px]">
                              <p className="text-sm text-muted-foreground">Colors</p>
                              <p className="text-lg font-semibold text-foreground">{colors.length}</p>
                            </div>

                            {/* Status Badge */}
                            {!hasColors ? (
                              <Badge className="bg-secondary text-muted-foreground">No Colors</Badge>
                            ) : isOutOfStock ? (
                              <Badge className="bg-red-900/30 text-red-400">Sold Out</Badge>
                            ) : hasLowStock ? (
                              <Badge className="bg-yellow-900/30 text-yellow-400">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-900/50 text-green-400">In Stock</Badge>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Color Variants */}
                      <CollapsibleContent>
                        <div className="border-t border-border px-4 py-3 bg-secondary">
                          {/* Action Row */}
                          <div className="flex justify-between items-center mb-3">
                            {/* Select All for this string */}
                            {selectMode && colors.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`select-all-${string.id}`}
                                  checked={isStringFullySelected(string.id) ? true : isStringPartiallySelected(string.id) ? 'indeterminate' : false}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      selectAllInString(string.id)
                                    } else {
                                      deselectAllInString(string.id)
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`select-all-${string.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  Select all {colors.length} colors
                                </Label>
                              </div>
                            )}
                            {!selectMode && <div />}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                openAddColorDialog(string.id)
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Color
                            </Button>
                          </div>

                          {colors.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              No color variants added yet. Click &quot;Add Color&quot; to add one.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {colors.map((stock) => {
                                const isColorOutOfStock = stock.quantity === 0
                                const isColorLowStock = stock.quantity > 0 && stock.quantity <= stock.lowStockAlert

                                return (
                                  <div
                                    key={stock.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                      selectedIds.has(stock.id)
                                        ? 'bg-teal-900/30 border border-teal-800'
                                        : isColorOutOfStock
                                        ? 'bg-red-900/30'
                                        : isColorLowStock
                                        ? 'bg-yellow-900/30'
                                        : 'bg-card'
                                    }`}
                                  >
                                    <div
                                      className={`flex items-center gap-3 ${selectMode ? 'cursor-pointer flex-1' : ''}`}
                                      onClick={selectMode ? () => toggleSelectStock(stock.id) : undefined}
                                    >
                                      {selectMode && (
                                        <Checkbox
                                          checked={selectedIds.has(stock.id)}
                                          onCheckedChange={() => toggleSelectStock(stock.id)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                      <div
                                        className="w-6 h-6 rounded-full border-2 border-[#5a554a]"
                                        style={{
                                          backgroundColor: stock.color.toLowerCase(),
                                        }}
                                        title={stock.color}
                                      />
                                      <span className="font-medium text-foreground">{stock.color}</span>
                                      {isColorOutOfStock && (
                                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                      )}
                                      {isColorLowStock && (
                                        <Badge className="bg-yellow-900/30 text-yellow-400 text-xs">Low</Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {/* Quick Adjust */}
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            quickAdjust(stock, -1)
                                          }}
                                          disabled={stock.quantity === 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-10 text-center font-semibold text-foreground">
                                          {stock.quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            quickAdjust(stock, 1)
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>

                                      {/* Edit Button */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openEditDialog(stock)
                                        }}
                                      >
                                        Edit
                                      </Button>

                                      {/* Delete Button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setStockToDelete(stock)
                                          setDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Color Dialog */}
      <Dialog open={addColorDialogOpen} onOpenChange={setAddColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Color Variant</DialogTitle>
            <DialogDescription>
              {addColorStringId && getStringById(addColorStringId)?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Color Name</Label>
              <Input
                placeholder="e.g., Red, Blue, White"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
              {/* Quick color select */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_COLORS.map((color) => {
                  const existingColors = addColorStringId
                    ? getColorsForString(addColorStringId).map((c) => c.color.toLowerCase())
                    : []
                  const alreadyExists = existingColors.includes(color.toLowerCase())

                  return (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={alreadyExists}
                      onClick={() => setNewColor(color)}
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-1 border"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Initial Quantity</Label>
              <Input
                type="number"
                min={0}
                value={newColorQuantity}
                onChange={(e) => setNewColorQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColor} disabled={addingColor || !newColor.trim()}>
              {addingColor && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock</DialogTitle>
            <DialogDescription>
              {selectedStock && (
                <>
                  {getStringById(selectedStock.stringId)?.fullName} - {selectedStock.color}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={0}
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Low Stock Alert Threshold</Label>
              <Input
                type="number"
                min={0}
                value={editLowAlert}
                onChange={(e) => setEditLowAlert(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls to or below this number
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="e.g., Restocked from supplier, Inventory correction"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStock} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Color Variant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {stockToDelete?.color} variant for{' '}
              {stockToDelete && getStringById(stockToDelete.stringId)?.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteColor} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>Recent stock changes and adjustments</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No stock history yet</p>
            ) : (
              logs.map((log) => {
                const stringInfo = getStringById(log.stock.stringId)
                const isIncrease = log.newQty > log.previousQty

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-secondary"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isIncrease ? 'bg-green-900/50' : 'bg-red-900/30'
                      }`}
                    >
                      {isIncrease ? (
                        <Plus className="w-4 h-4 text-green-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {stringInfo?.fullName || log.stock.stringId}
                        {log.stock.color && (
                          <span className="text-muted-foreground font-normal"> - {log.stock.color}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.previousQty} → {log.newQty} (
                        {isIncrease ? '+' : ''}
                        {log.newQty - log.previousQty})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {log.changeType === 'order'
                            ? 'Order'
                            : log.changeType === 'restock'
                            ? 'Restock'
                            : log.changeType === 'color_added'
                            ? 'Color Added'
                            : 'Manual'}
                        </Badge>
                        {log.reason && (
                          <span className="text-xs text-muted-foreground">{log.reason}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {format(new Date(log.createdAt), 'PPp')} by {log.changedBy || 'System'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Stock</DialogTitle>
            <DialogDescription>
              Set quantity for {selectedIds.size} selected item{selectedIds.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview selected items */}
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 bg-secondary">
              <p className="text-xs text-muted-foreground mb-2">Selected items:</p>
              <div className="flex flex-wrap gap-1">
                {getSelectedStocks().slice(0, 10).map((stock) => (
                  <Badge key={stock.id} variant="outline" className="text-xs">
                    {getStringById(stock.stringId)?.name} - {stock.color}
                  </Badge>
                ))}
                {selectedIds.size > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedIds.size - 10} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Quantity for All</Label>
              <Input
                type="number"
                min={0}
                value={bulkEditQuantity}
                onChange={(e) => setBulkEditQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="e.g., Bulk restock, Inventory correction"
                value={bulkEditReason}
                onChange={(e) => setBulkEditReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEdit} disabled={bulkSaving}>
              {bulkSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected item{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Preview selected items */}
            <div className="max-h-48 overflow-y-auto border border-red-800 rounded-lg p-2 bg-red-900/20">
              <p className="text-xs text-red-400 mb-2">Items to be deleted:</p>
              <div className="space-y-1">
                {getSelectedStocks().map((stock) => (
                  <div key={stock.id} className="flex items-center gap-2 text-sm text-foreground">
                    <div
                      className="w-4 h-4 rounded-full border border-[#5a554a]"
                      style={{ backgroundColor: stock.color.toLowerCase() }}
                    />
                    <span>
                      {getStringById(stock.stringId)?.fullName} - {stock.color}
                    </span>
                    <span className="text-muted-foreground">({stock.quantity} in stock)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
