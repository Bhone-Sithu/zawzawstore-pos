'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database.types'

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
        // Reset form for new product
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
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (error) throw error
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error saving product:', error)
      if (error.message.includes('barcode')) {
        setErrors({ barcode: 'This barcode is already in use' })
      } else {
        setErrors({ general: 'Failed to save product. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barcode */}
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode *
            </label>
            <div className="flex gap-2">
              <input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.barcode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter barcode"
              />
              <button
                type="button"
                onClick={generateBarcode}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Generate
              </button>
            </div>
            {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
          </div>

          {/* Product Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-1">
                English Name *
              </label>
              <input
                id="name_en"
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name_en ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Product name in English"
              />
              {errors.name_en && <p className="mt-1 text-sm text-red-600">{errors.name_en}</p>}
            </div>

            <div>
              <label htmlFor="name_mm" className="block text-sm font-medium text-gray-700 mb-1">
                Myanmar Name *
              </label>
              <input
                id="name_mm"
                type="text"
                value={formData.name_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, name_mm: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name_mm ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="မြန်မာ အမည်"
              />
              {errors.name_mm && <p className="mt-1 text-sm text-red-600">{errors.name_mm}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (RM) *
              </label>
              <input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cost_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.cost_price && <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>}
            </div>

            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (RM) *
              </label>
              <input
                id="selling_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.selling_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.selling_price && <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>}
            </div>
          </div>

          {/* Low Stock Threshold & Expiry Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Alert (units)
              </label>
              <input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.low_stock_threshold ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="3"
              />
              {errors.low_stock_threshold && <p className="mt-1 text-sm text-red-600">{errors.low_stock_threshold}</p>}
            </div>

            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="description_en" className="block text-sm font-medium text-gray-700 mb-1">
                English Description
              </label>
              <textarea
                id="description_en"
                rows={3}
                value={formData.description_en}
                onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Product description in English"
              />
            </div>

            <div>
              <label htmlFor="description_mm" className="block text-sm font-medium text-gray-700 mb-1">
                Myanmar Description
              </label>
              <textarea
                id="description_mm"
                rows={3}
                value={formData.description_mm}
                onChange={(e) => setFormData(prev => ({ ...prev, description_mm: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="မြန်မာ ဖော်ပြချက်"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}