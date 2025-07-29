'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database.types'

interface LowStockProduct extends Product {
  total_stock: number
  inventory_by_branch: Array<{
    branch_name: string
    branch_location: string
    quantity: number
  }>
}

interface LowStockAlertProps {
  onRefresh?: () => void
}

export default function LowStockAlert({ onRefresh }: LowStockAlertProps) {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true)
      
      // Fetch products with their inventory across all branches
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory!inner(
            quantity,
            branch:branches(
              name,
              location
            )
          )
        `)
        .eq('is_active', true)

      if (error) throw error

      // Process products to calculate total stock and filter low stock items
      const processedProducts: LowStockProduct[] = []

      for (const product of productsData || []) {
        const totalStock = product.inventory.reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0)
        
        if (totalStock <= product.low_stock_threshold) {
          const inventoryByBranch = product.inventory.map((inv: { quantity: number; branch: { name: string; location: string } }) => ({
            branch_name: inv.branch.name,
            branch_location: inv.branch.location,
            quantity: inv.quantity
          }))

          processedProducts.push({
            ...product,
            total_stock: totalStock,
            inventory_by_branch: inventoryByBranch
          })
        }
      }

      setLowStockProducts(processedProducts)
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2" />
          <span className="text-sm text-gray-600">Checking low stock items...</span>
        </div>
      </div>
    )
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">✅</span>
          <span className="text-sm font-medium text-green-800">All products are well-stocked!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <h3 className="text-lg font-medium text-red-800">
              Low Stock Alert ({lowStockProducts.length} items)
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchLowStockProducts}
              className="text-red-600 hover:text-red-800"
              title="Refresh"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className={`h-4 w-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name_en}</h4>
                    <p className="text-sm text-gray-600">{product.name_mm}</p>
                    <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{product.total_stock} units</p>
                    <p className="text-xs text-gray-500">Alert: ≤{product.low_stock_threshold}</p>
                  </div>
                </div>

                {/* Stock by Branch */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Stock by Branch:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {product.inventory_by_branch.map((branch, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2">
                        <p className="text-xs font-medium text-gray-900">{branch.branch_name}</p>
                        <p className="text-xs text-gray-600">{branch.branch_location}</p>
                        <p className={`text-sm font-bold ${branch.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {branch.quantity} units
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    onClick={() => {
                      // This would open a restock modal or redirect to inventory management
                      console.log('Restock product:', product.id)
                    }}
                  >
                    Restock
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    onClick={() => {
                      // This would open the product edit form
                      console.log('Edit product:', product.id)
                    }}
                  >
                    Edit Alert
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Actions */}
          <div className="mt-4 pt-4 border-t border-red-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">
                {lowStockProducts.length} products need restocking
              </p>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    // This would generate a restock report
                    console.log('Generate restock report')
                  }}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Generate Restock Report
                </button>
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Refresh Inventory
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}