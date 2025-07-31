'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductList from './ProductList'
import LowStockAlert from './LowStockAlert'
import type { Product } from '@/types/database.types'
import { Package, AlertTriangle, RefreshCw, Download, Plus, X } from 'lucide-react'

export default function InventoryManagement() {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<'products' | 'alerts'>('products')

  const handleAddProduct = () => {
    router.push('/admin/products/create')
  }

  const handleEditProduct = (product: Product) => {
    // For now, redirect to create page - we can create an edit page later
    router.push(`/admin/products/create?edit=${product.id}`)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId)

      if (error) throw error

      // Refresh the product list
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }


  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage products, track stock levels, and monitor alerts</p>
        </div>
        <button
          type="button"
          onClick={handleAddProduct}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Low Stock Alert - Always visible if there are alerts */}
      <LowStockAlert onRefresh={refreshData} />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4" />
              All Products
            </button>
            <button
              type="button" 
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'alerts'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Stock Alerts
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Product Catalog</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={refreshData}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Export functionality would go here
                      console.log('Export products')
                    }}
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
              
              <ProductList
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Stock Management</h2>
                <p className="text-sm text-gray-600">Monitor and manage low stock items across all branches</p>
              </div>
              
              {/* Stock Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-blue-600 mr-3">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Products</p>
                      <p className="text-2xl font-bold text-blue-900">--</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-yellow-600 mr-3">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-900">--</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-red-600 mr-3">
                      <X className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-900">--</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Low Stock Alert */}
              <LowStockAlert onRefresh={refreshData} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}