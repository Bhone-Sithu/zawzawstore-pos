'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database.types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shuffle, AlertCircle } from 'lucide-react'

interface ProductFormProps {
  product?: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function ProductForm({ product, isOpen, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    barcode: '',
    name_en: '',
    name_mm: '',
    description_en: '',
    description_mm: '',
    category_id: '',
    cost_price: 0,
    selling_price: 0,
    low_stock_threshold: 3,
    expiry_date: ''
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (product) {
        setFormData({
          barcode: product.barcode,
          name_en: product.name_en,
          name_mm: product.name_mm,
          description_en: product.description_en || '',
          description_mm: product.description_mm || '',
          category_id: product.category_id || '',
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          low_stock_threshold: product.low_stock_threshold,
          expiry_date: product.expiry_date || ''
        })
      } else {
        setFormData({
          barcode: '',
          name_en: '',
          name_mm: '',
          description_en: '',
          description_mm: '',
          category_id: '',
          cost_price: 0,
          selling_price: 0,
          low_stock_threshold: 3,
          expiry_date: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_en')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const generateBarcode = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString().slice(-4)
    const barcode = timestamp + random
    setFormData(prev => ({ ...prev, barcode }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required'
    if (!formData.name_en.trim()) newErrors.name_en = 'English name is required'
    if (!formData.name_mm.trim()) newErrors.name_mm = 'Myanmar name is required' 
    if (formData.cost_price <= 0) newErrors.cost_price = 'Cost price must be greater than 0'
    if (formData.selling_price <= 0) newErrors.selling_price = 'Selling price must be greater than 0'
    if (formData.selling_price <= formData.cost_price) newErrors.selling_price = 'Selling price must be greater than cost price'
    if (formData.low_stock_threshold < 0) newErrors.low_stock_threshold = 'Low stock threshold cannot be negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const productData = {
        ...formData,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        low_stock_threshold: Number(formData.low_stock_threshold),
        category_id: formData.category_id || null,
        expiry_date: formData.expiry_date || null
      }

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      if ((error as { message?: string })?.message?.includes('barcode')) {
        setErrors({ barcode: 'This barcode is already in use' })
      } else {
        setErrors({ general: 'Failed to save product. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const profit = formData.selling_price - formData.cost_price
  const profitMargin = formData.cost_price > 0 ? ((profit / formData.cost_price) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50">
        <DialogHeader className="bg-white p-6 rounded-t-lg -m-6 mb-6">
          <DialogTitle className="text-xl text-gray-800">
            {product ? '✏️ Edit Product' : '➕ Add New Product'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {product ? 'Update product information and pricing' : 'Create a new product with bilingual support'}
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-white border-blue-100 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  📝 Basic Information
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Required</Badge>
              </div>

              {/* Barcode */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <Label htmlFor="barcode" className="text-gray-700 font-medium">📊 Barcode *</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter or generate barcode"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.barcode ? 'border-red-300' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateBarcode}
                    className="shrink-0 bg-white border-gray-200 hover:bg-gray-50"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                {errors.barcode && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.barcode}</p>
                )}
              </div>

              {/* Product Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="name_en" className="text-gray-700 font-medium">🇬🇧 English Name *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Product name in English"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.name_en ? 'border-red-300' : ''}`}
                  />
                  {errors.name_en && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.name_en}</p>
                  )}
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="name_mm" className="text-gray-700 font-medium">🇲🇲 Myanmar Name *</Label>
                  <Input
                    id="name_mm"
                    value={formData.name_mm}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                    placeholder="မြန်မာ အမည်"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.name_mm ? 'border-red-300' : ''}`}
                  />
                  {errors.name_mm && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.name_mm}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <Label htmlFor="category" className="text-gray-700 font-medium">🏷️ Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Select a category" className="text-gray-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-white border-green-100 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  💰 Pricing Information
                </h3>
                {profit > 0 && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Profit: RM {profit.toFixed(2)} ({profitMargin.toFixed(1)}%)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="cost_price" className="text-gray-700 font-medium">🏪 Cost Price (RM) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_price: Number.parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.cost_price ? 'border-red-300' : ''}`}
                  />
                  {errors.cost_price && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.cost_price}</p>
                  )}
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="selling_price" className="text-gray-700 font-medium">💵 Selling Price (RM) *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, selling_price: Number.parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.selling_price ? 'border-red-300' : ''}`}
                  />
                  {errors.selling_price && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.selling_price}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card className="bg-white border-purple-100 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  ⚙️ Additional Settings
                </h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Optional</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="low_stock_threshold" className="text-gray-700 font-medium">⚠️ Low Stock Alert (units)</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: Number.parseInt(e.target.value) || 0 }))}
                    placeholder="3"
                    className={`bg-white border-gray-200 placeholder:text-gray-500 ${errors.low_stock_threshold ? 'border-red-300' : ''}`}
                  />
                  {errors.low_stock_threshold && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.low_stock_threshold}</p>
                  )}
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="expiry_date" className="text-gray-700 font-medium">📅 Expiry Date (Optional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="bg-white border-gray-200"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="description_en" className="text-gray-700 font-medium">🇬🇧 English Description</Label>
                  <textarea
                    id="description_en"
                    rows={3}
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Product description in English"
                    className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                  <Label htmlFor="description_mm" className="text-gray-700 font-medium">🇲🇲 Myanmar Description</Label>
                  <textarea
                    id="description_mm"
                    rows={3}
                    value={formData.description_mm}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_mm: e.target.value }))}
                    placeholder="မြန်မာ ဖော်ပြချက်"
                    className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="bg-white p-6 rounded-b-lg -m-6 mt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}