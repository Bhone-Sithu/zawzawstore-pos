'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database.types'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    image: '',
    category_id: '',
    base_price: ''
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
          image: product.image || '',
          category_id: product.category_id || '',
          base_price: product.base_price.toString()
        })
      } else {
        setFormData({
          barcode: '',
          name_en: '',
          name_mm: '',
          image: '',
          category_id: '',
          base_price: ''
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
    const basePrice = Number.parseFloat(formData.base_price)
    if (!formData.base_price || isNaN(basePrice) || basePrice <= 0) {
      newErrors.base_price = 'Base price must be greater than 0'
    }

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
        base_price: Number.parseFloat(formData.base_price),
        category_id: formData.category_id || null,
        image: formData.image || null
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update product information' : 'Create a new product for your catalog'}
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode *</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Enter or generate barcode"
                    className={errors.barcode ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateBarcode}
                    className="shrink-0"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.barcode && (
                  <p className="text-sm text-destructive">{errors.barcode}</p>
                )}
              </div>

              {/* Product Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">English Name *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Product name in English"
                    className={errors.name_en ? 'border-destructive' : ''}
                  />
                  {errors.name_en && (
                    <p className="text-sm text-destructive">{errors.name_en}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_mm">Myanmar Name *</Label>
                  <Input
                    id="name_mm"
                    value={formData.name_mm}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                    placeholder="မြန်မာ အမည်"
                    className={errors.name_mm ? 'border-destructive' : ''}
                  />
                  {errors.name_mm && (
                    <p className="text-sm text-destructive">{errors.name_mm}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
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

          {/* Product Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Enter a URL for the product image
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price (RM) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                  placeholder="Enter price (e.g., 10.50)"
                  className={errors.base_price ? 'border-destructive' : ''}
                />
                {errors.base_price && (
                  <p className="text-sm text-destructive">{errors.base_price}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  This is the base price that can be customized per branch
                </p>
              </div>
            </CardContent>
          </Card>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}