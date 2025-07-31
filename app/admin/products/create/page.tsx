'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Image as ImageIcon, Shuffle, ArrowLeft } from 'lucide-react'
import type { Category } from '@/types/database.types'

export default function CreateProductPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    seller: '',
    name_en: '',
    description_en: '',
    quantity: 1,
    name_mm: '',
    description_mm: '',
    category_id: '',
    cost_price: 0,
    selling_price: 0,
    low_stock_threshold: 3,
    expiry_date: '',
    barcode: ''
  })

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isLoaded || !user) return

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', user.id)
          .eq('is_active', true)
          .single()

        if (error || !userData || userData.role !== 'admin') {
          setIsAuthorized(false)
          router.push('/access-denied')
          return
        }

        setIsAuthorized(true)
        fetchCategories()
      } catch (error) {
        console.error('Error checking permissions:', error)
        setIsAuthorized(false)
        router.push('/access-denied')
      }
    }

    checkPermissions()
  }, [user, isLoaded, router])

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

    if (!formData.seller.trim()) newErrors.seller = 'Seller is required'
    if (!formData.name_en.trim()) newErrors.name_en = 'Product name is required'
    if (!formData.description_en.trim()) newErrors.description_en = 'Description is required'
    if (formData.cost_price <= 0) newErrors.cost_price = 'Cost price must be greater than 0'
    if (formData.selling_price <= 0) newErrors.selling_price = 'Selling price must be greater than 0'
    if (formData.selling_price <= formData.cost_price) newErrors.selling_price = 'Selling price must be greater than cost price'
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const productData = {
        barcode: formData.barcode || `AUTO_${Date.now()}`,
        name_en: formData.name_en,
        name_mm: formData.name_mm || formData.name_en,
        description_en: formData.description_en,
        description_mm: formData.description_mm,
        category_id: formData.category_id || null,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        low_stock_threshold: Number(formData.low_stock_threshold),
        expiry_date: formData.expiry_date || null,
        is_active: true
      }

      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (error) throw error

      router.push('/admin/products')
    } catch (error: unknown) {
      console.error('Error creating product:', error)
      if ((error as { message?: string })?.message?.includes('barcode')) {
        setErrors({ barcode: 'This barcode is already in use' })
      } else {
        setErrors({ general: 'Failed to create product. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/products')
  }

  const handleClear = () => {
    setFormData({
      seller: '',
      name_en: '',
      description_en: '',
      quantity: 1,
      name_mm: '',
      description_mm: '',
      category_id: '',
      cost_price: 0,
      selling_price: 0,
      low_stock_threshold: 3,
      expiry_date: '',
      barcode: ''
    })
    setErrors({})
  }

  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <nav className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-orange-100 text-orange-700"
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Settings
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
              <SignOutButton>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                  Logout
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/products')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Create Product</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>

        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-600 text-sm">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">General Information</h3>
              </div>

              <div className="space-y-6">
                {/* Seller */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seller <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.seller}
                    onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Seller</option>
                    <option value="admin">Admin</option>
                    <option value="branch_manager">Branch Manager</option>
                  </select>
                  {errors.seller && (
                    <p className="mt-1 text-sm text-red-600">{errors.seller}</p>
                  )}
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Enter Product Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.name_en && (
                    <p className="mt-1 text-sm text-red-600">{errors.name_en}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Describe the product"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.description_en && (
                    <p className="mt-1 text-sm text-red-600">{errors.description_en}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.cost_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.selling_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>
                    )}
                  </div>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Enter or generate barcode"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <Shuffle className="h-4 w-4" />
                      Generate
                    </button>
                  </div>
                  {errors.barcode && (
                    <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>
                  )}
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Images</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Product Images (Up to 6 images)
                </p>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Upload main image</p>
                      <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <p>• Supported formats: JPG, PNG, GIF</p>
                  <p>• Maximum file size: 10MB</p>
                  <p>• Recommended size: 800x800px</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {errors.general && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}
      </main>
    </div>
  )
}