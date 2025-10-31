'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, CheckCircle, X } from 'lucide-react'
import type { Product, Branch } from '@/types/database.types'
import * as inventoryService from '@/services/inventory-service'

interface AddInventoryFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  selectedBranchId?: string
}

interface ProductInfo extends Product {
  category?: {
    name_en: string
    name_mm: string
  }
  currentStock?: number
}

export default function AddInventoryForm({ onSuccess, onCancel, selectedBranchId }: AddInventoryFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null)
  const [branchId, setBranchId] = useState(selectedBranchId || '')
  const [quantity, setQuantity] = useState<number>(0)
  const [price, setPrice] = useState<number | undefined>()
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchResults, setSearchResults] = useState<ProductInfo[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts()
    } else {
      setSearchResults([])
      setSelectedProduct(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, branchId])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const searchProducts = async () => {
    try {
      setSearching(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(
            name_en,
            name_mm
          )
        `)
        .eq('is_active', true)
        .or(`name_en.ilike.%${searchTerm}%,name_mm.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error

      // Get current stock for each product in the selected branch
      const productsWithStock = await Promise.all(
        (data || []).map(async (product) => {
          if (branchId) {
            const { data: inventory } = await supabase
              .from('inventory')
              .select('quantity')
              .eq('product_id', product.id)
              .eq('branch_id', branchId)
              .single()

            return {
              ...product,
              currentStock: inventory?.quantity || 0
            }
          }
          return { ...product, currentStock: 0 }
        })
      )

      setSearchResults(productsWithStock)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleProductSelect = (product: ProductInfo) => {
    setSelectedProduct(product)
    setSearchTerm(`${product.name_en} (${product.barcode})`)
    setPrice(product.base_price)
    setSearchResults([])
  }

  const handleBarcodeScan = (barcode: string) => {
    setSearchTerm(barcode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct || !branchId || quantity <= 0) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Check if inventory record already exists
      const { data: existingInventory } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', selectedProduct.id)
        .eq('branch_id', branchId)
        .single()

      if (existingInventory) {
        // Update existing inventory
        const newQuantity = existingInventory.quantity + quantity
        const result = await inventoryService.updateInventoryQuantity(existingInventory.id, newQuantity)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update inventory')
        }
      } else {
        // Create new inventory record
        const result = await inventoryService.createInventoryRecord(
          selectedProduct.id,
          branchId,
          quantity,
          price,
          expiryDate || undefined
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create inventory')
        }
      }

      setMessage({ type: 'success', text: `Successfully added ${quantity} units to inventory` })
      
      // Reset form
      setSearchTerm('')
      setSelectedProduct(null)
      setQuantity(0)
      setPrice(undefined)
      setExpiryDate('')
      
      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 1500)
      }
    } catch (error) {
      console.error('Error adding inventory:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to add inventory' 
      })
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedProduct(null)
    setSearchTerm('')
    setSearchResults([])
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add Inventory Stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Branch *
            </label>
            <RadioGroup value={branchId} onValueChange={setBranchId} className="space-y-3">
              {branches.map(branch => (
                <div key={branch.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem 
                    value={branch.id} 
                    id={branch.id}
                    className="cursor-pointer"
                  />
                  <Label 
                    htmlFor={branch.id} 
                    className="flex-1 cursor-pointer font-medium text-gray-900"
                  >
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-sm text-gray-600">{branch.location}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product * {searching && <span className="text-xs text-gray-500">(Searching...)</span>}
            </label>
            <div className="relative">
              <BarcodeInput
                value={searchTerm}
                onChange={setSearchTerm}
                onScan={handleBarcodeScan}
                placeholder="Search product by name or scan barcode..."
                className="w-full"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                  {searchResults.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.name_en}</p>
                          <p className="text-sm text-gray-600">{product.name_mm}</p>
                          <p className="text-xs text-gray-500">{product.barcode}</p>
                          {product.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {product.category.name_en}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-medium">RM {product.base_price.toFixed(2)}</p>
                          {branchId && (
                            <p className="text-xs text-gray-500">
                              Current: {product.currentStock || 0} units
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Product Display */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">{selectedProduct.name_en}</h3>
                  <p className="text-sm text-blue-700">{selectedProduct.name_mm}</p>
                  <p className="text-xs text-blue-600">Barcode: {selectedProduct.barcode}</p>
                  {selectedProduct.category && (
                    <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-800">
                      {selectedProduct.category.name_en}
                    </Badge>
                  )}
                  {branchId && (
                    <p className="text-sm text-blue-700 mt-1">
                      Current Stock: {selectedProduct.currentStock || 0} units
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Add *
            </label>
            <Input
              type="number"
              min="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              required
              className="cursor-pointer"
            />
          </div>

          {/* Price Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Override (Optional)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price || ''}
              onChange={(e) => setPrice(parseFloat(e.target.value) || undefined)}
              placeholder="Leave empty to use base price"
              className="cursor-pointer"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">
                Base price: RM {selectedProduct.base_price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date (Optional)
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="cursor-pointer"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !selectedProduct || !branchId || quantity <= 0}
              className="flex-1 cursor-pointer"
            >
              {loading ? 'Adding...' : 'Add to Inventory'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}