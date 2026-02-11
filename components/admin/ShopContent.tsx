'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertCircle,
  ImageIcon,
  Star,
  X,
  Upload,
} from 'lucide-react'
import { isAdmin } from '@/lib/admin'
import { useTranslations } from 'next-intl'
import { SHOP_CATEGORIES, type ShopCategoryId } from '@/lib/shop-config'

interface ShopProduct {
  id: string
  productId: string
  category: string
  subcategory: string | null
  brand: string
  name: string
  fullName: string
  price: number
  description: string | null
  specs: Record<string, string> | null
  image: string
  images: string[] | null
  colors: string[] | null
  sizes: string[] | null
  inStock: boolean
  stockCount: number
  featured: boolean
  createdAt: string
  updatedAt: string
}

const EMPTY_PRODUCT = {
  productId: '',
  category: 'rackets' as string,
  subcategory: '',
  brand: '',
  name: '',
  fullName: '',
  price: 0,
  stockCount: 0,
  description: '',
  image: '/images/shop/placeholder.jpg',
  images: [] as string[],
  inStock: true,
  featured: false,
}

export default function ShopContent() {
  const { data: session } = useSession()
  const t = useTranslations('admin.shop')

  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)

  // Form state
  const [formData, setFormData] = useState(EMPTY_PRODUCT)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/shop/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'inStock' && product.inStock) ||
      (stockFilter === 'outOfStock' && !product.inStock)

    return matchesSearch && matchesCategory && matchesStock
  })

  const handleToggleStock = async (product: ShopProduct) => {
    try {
      const res = await fetch(`/api/shop/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock }),
      })
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, inStock: !p.inStock } : p))
        )
      }
    } catch (error) {
      console.error('Failed to toggle stock:', error)
    }
  }

  const handleToggleFeatured = async (product: ShopProduct) => {
    try {
      const res = await fetch(`/api/shop/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      })
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p))
        )
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
  }

  const handleEditClick = (product: ShopProduct) => {
    setSelectedProduct(product)
    setFormData({
      productId: product.productId,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand,
      name: product.name,
      fullName: product.fullName,
      price: product.price,
      stockCount: product.stockCount,
      description: product.description || '',
      image: product.image,
      images: product.images || [],
      inStock: product.inStock,
      featured: product.featured,
    })
    setEditDialogOpen(true)
  }

  const handleAddClick = () => {
    setFormData(EMPTY_PRODUCT)
    setAddDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedProduct) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/shop/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          subcategory: formData.subcategory || null,
          brand: formData.brand,
          name: formData.name,
          fullName: formData.fullName,
          price: Number(formData.price),
          stockCount: Number(formData.stockCount),
          description: formData.description || null,
          image: formData.image,
          images: formData.images.length > 0 ? formData.images : null,
          inStock: formData.inStock,
          featured: formData.featured,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setEditDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to update product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!formData.productId || !formData.brand || !formData.name || !formData.fullName) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/shop/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          category: formData.category,
          subcategory: formData.subcategory || null,
          brand: formData.brand,
          name: formData.name,
          fullName: formData.fullName,
          price: Number(formData.price),
          stockCount: Number(formData.stockCount),
          description: formData.description || null,
          image: formData.image,
          images: formData.images.length > 0 ? formData.images : null,
          inStock: formData.inStock,
          featured: formData.featured,
        }),
      })
      if (res.ok) {
        const newProduct = await res.json()
        setProducts((prev) => [newProduct, ...prev])
        setAddDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to add product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteClick = (product: ShopProduct) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/shop/products/${selectedProduct.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
        setDeleteDialogOpen(false)
        setSelectedProduct(null)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (!session?.user || !isAdmin(session.user.email, session.user.isAdmin)) {
    return null
  }

  const inStockCount = products.filter((p) => p.inStock).length
  const outOfStockCount = products.filter((p) => !p.inStock).length
  const featuredCount = products.filter((p) => p.featured).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{products.length}</div>
            <div className="text-sm text-muted-foreground">{t('totalProducts')}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
            <div className="text-sm text-muted-foreground">{t('inStock')}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <div className="text-sm text-muted-foreground">{t('outOfStock')}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{featuredCount}</div>
            <div className="text-sm text-muted-foreground">{t('featured')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {SHOP_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
            <SelectValue placeholder={t('allStock')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStock')}</SelectItem>
            <SelectItem value="inStock">{t('inStock')}</SelectItem>
            <SelectItem value="outOfStock">{t('outOfStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddClick} className="bg-[#1854d6] hover:bg-[#1347b8] text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t('addProduct')}
        </Button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t('noProducts')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('image')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('productName')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('brand')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t('category')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('price')}</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">{t('stockCount')}</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">{t('stock')}</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('featuredLabel')}</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
                        {product.image && !product.image.includes('placeholder') ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{product.brand}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm text-foreground">{product.brand}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium text-foreground">RM{product.price.toFixed(2)}</span>
                    </td>
                    <td className="p-3 text-center">
                      <InlineStockEditor
                        value={product.stockCount}
                        onSave={async (val) => {
                          try {
                            const res = await fetch(`/api/shop/products/${product.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ stockCount: val }),
                            })
                            if (res.ok) {
                              setProducts((prev) =>
                                prev.map((p) => (p.id === product.id ? { ...p, stockCount: val } : p))
                              )
                            }
                          } catch (error) {
                            console.error('Failed to update stock count:', error)
                          }
                        }}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Switch
                        checked={product.inStock}
                        onCheckedChange={() => handleToggleStock(product)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">
                      <button
                        onClick={() => handleToggleFeatured(product)}
                        className={`p-1 rounded transition-colors ${
                          product.featured
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-muted-foreground/30 hover:text-muted-foreground/60'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${product.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {t('showing', { count: filteredProducts.length, total: products.length })}
            </p>
          </div>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editProduct')}</DialogTitle>
            <DialogDescription>{t('editProductDescription')}</DialogDescription>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            t={t}
            disableProductId
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="bg-[#1854d6] hover:bg-[#1347b8] text-white"
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addProduct')}</DialogTitle>
            <DialogDescription>{t('addProductDescription')}</DialogDescription>
          </DialogHeader>
          <ProductForm
            formData={formData}
            setFormData={setFormData}
            t={t}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={actionLoading || !formData.productId || !formData.brand || !formData.name || !formData.fullName}
              className="bg-[#1854d6] hover:bg-[#1347b8] text-white"
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('addProduct')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t('deleteProduct')}
            </DialogTitle>
            <DialogDescription>
              {t('deleteConfirm', { name: selectedProduct?.fullName || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file: File): Promise<string | null> => {
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        return data.url
      } else {
        setError(data.message || 'Upload failed')
        return null
      }
    } catch {
      setError('Upload failed. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error, setError }
}

function ImageUploadZone({
  image,
  onImageChange,
}: {
  image: string
  onImageChange: (url: string) => void
}) {
  const { upload, uploading, error } = useImageUpload()
  const [dragOver, setDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = await upload(file)
      if (url) onImageChange(url)
    }
    if (e.target) e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = await upload(file)
      if (url) onImageChange(url)
    }
  }

  const hasImage = image && !image.includes('placeholder')

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <span>Main Image</span>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {showUrlInput ? 'Upload' : 'Enter URL'}
        </button>
      </Label>

      {showUrlInput ? (
        <div className="space-y-2">
          <Input
            value={image}
            onChange={(e) => onImageChange(e.target.value)}
            placeholder="https://... or /images/shop/..."
          />
          {hasImage && (
            <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
            dragOver
              ? 'border-[#1854d6] bg-[#1854d6]/5'
              : 'border-border hover:border-[#1854d6]/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {hasImage ? (
            <div className="flex items-center gap-3 p-3">
              <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border flex-shrink-0">
                <img src={image} alt="Product" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">Image uploaded</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click or drag to replace</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onImageChange('/images/shop/placeholder.jpg')
                }}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#1854d6] mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-foreground font-medium">
                {uploading ? 'Uploading...' : 'Click or drag image'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP up to 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function AdditionalImagesZone({
  images,
  onImagesChange,
}: {
  images: string[]
  onImagesChange: (urls: string[]) => void
}) {
  const { upload, uploading, error } = useImageUpload()
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const newUrls: string[] = []
    for (const file of imageFiles) {
      const url = await upload(file)
      if (url) newUrls.push(url)
    }
    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    if (e.target) e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label>Additional Images</Label>

      {/* Thumbnail grid of existing additional images */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border">
              <img src={url} alt={`Additional ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone for adding more */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          dragOver
            ? 'border-[#1854d6] bg-[#1854d6]/5'
            : 'border-border hover:border-[#1854d6]/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 py-3 px-4">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1854d6]" />
          ) : (
            <Plus className="w-4 h-4 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : 'Add more images'}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function ProductForm({
  formData,
  setFormData,
  t,
  disableProductId,
}: {
  formData: typeof EMPTY_PRODUCT
  setFormData: (data: typeof EMPTY_PRODUCT) => void
  t: ReturnType<typeof useTranslations>
  disableProductId?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('productId')}</Label>
          <Input
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            placeholder="e.g. racket-001"
            disabled={disableProductId}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('category')}</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOP_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('brand')}</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="e.g. Yonex"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('subcategory')}</Label>
          <Input
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            placeholder={t('optional')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('productName')}</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('shortName')}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('fullName')}</Label>
        <Input
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder={t('fullNamePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('price')} (RM)</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            min={0}
            step={0.01}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('stockCount')}</Label>
          <Input
            type="number"
            value={formData.stockCount}
            onChange={(e) => setFormData({ ...formData, stockCount: parseInt(e.target.value) || 0 })}
            min={0}
            step={1}
          />
        </div>
      </div>

      {/* Image Upload */}
      <ImageUploadZone
        image={formData.image}
        onImageChange={(url) => setFormData({ ...formData, image: url })}
      />

      {/* Additional Images */}
      <AdditionalImagesZone
        images={formData.images}
        onImagesChange={(urls) => setFormData({ ...formData, images: urls })}
      />

      <div className="space-y-2">
        <Label>{t('description')}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('descriptionPlaceholder')}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.inStock}
            onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
            className="data-[state=checked]:bg-green-600"
          />
          <Label>{t('inStock')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            className="data-[state=checked]:bg-amber-500"
          />
          <Label>{t('featured')}</Label>
        </div>
      </div>
    </div>
  )
}

function InlineStockEditor({
  value,
  onSave,
}: {
  value: number
  onSave: (val: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setEditValue(value.toString())
  }, [value])

  const handleSave = async () => {
    const num = parseInt(editValue) || 0
    setEditing(false)
    if (num !== value) {
      await onSave(num)
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') { setEditing(false); setEditValue(value.toString()) }
        }}
        className="w-16 h-7 text-center text-sm p-1"
        min={0}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
        value === 0
          ? 'text-red-600 bg-red-50 hover:bg-red-100'
          : value <= 5
            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
            : 'text-green-600 bg-green-50 hover:bg-green-100'
      }`}
      title="Click to edit"
    >
      {value}
    </button>
  )
}
