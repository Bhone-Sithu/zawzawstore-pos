'use client'

import { useState } from 'react'
import { useInventory } from '@/hooks/useInventory'
import EditInventoryDialog from './EditInventoryDialog'
import type { InventoryItem } from '@/types/inventory.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { Package, TrendingUp, AlertTriangle, X, Search, RefreshCw, Edit } from 'lucide-react'
import Image from 'next/image'

interface InventoryDashboardProps {
  selectedBranchId?: string
}

export default function InventoryDashboard({ selectedBranchId }: InventoryDashboardProps) {
  const { inventory, stats, loading, error, refetch, updateQuantity } = useInventory(selectedBranchId)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBranch, setFilterBranch] = useState<string>('all')
  const [filterStock, setFilterStock] = useState<string>('all') // all, low, out

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.name_mm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.barcode.includes(searchTerm)

    const matchesBranch = filterBranch === 'all' || item.branch_id === filterBranch

    const matchesStock = 
      filterStock === 'all' || 
      (filterStock === 'low' && item.quantity <= 3 && item.quantity > 0) ||
      (filterStock === 'out' && item.quantity === 0)

    return matchesSearch && matchesBranch && matchesStock
  })

  const handleEditSuccess = () => {
    refetch()
    setEditingItem(null)
  }

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (quantity <= 3) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const formatCurrency = (amount: number) => `RM ${amount.toFixed(2)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-lg text-gray-600">Loading inventory...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Error loading inventory</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={refetch} className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <X className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.outOfStockItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <BarcodeInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by name, barcode, or scan..."
                className="w-full"
              />
            </div>
            
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="w-[200px] cursor-pointer">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Branches</SelectItem>
                {stats && Object.entries(stats.byBranch).map(([branchId, branch]) => (
                  <SelectItem key={branchId} value={branchId} className="cursor-pointer">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="w-[180px] cursor-pointer">
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Stock</SelectItem>
                <SelectItem value="low" className="cursor-pointer">Low Stock</SelectItem>
                <SelectItem value="out" className="cursor-pointer">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={refetch} variant="outline" className="cursor-pointer">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Product</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Branch</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Stock</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Price</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Value</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4">Expiry</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item, index) => {
                  const stockStatus = getStockStatus(item.quantity)
                  const currentPrice = item.price || item.product.base_price
                  const value = item.quantity * currentPrice

                  return (
                    <TableRow key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {item.product.image ? (
                            <Image 
                              src={item.product.image} 
                              alt={item.product.name_en}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded border"
                              unoptimized={true}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name_en}</p>
                            <p className="text-sm text-gray-600">{item.product.name_mm}</p>
                            <p className="text-xs text-gray-500">{item.product.barcode}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.branch.name}</p>
                          <p className="text-sm text-gray-600">{item.branch.location}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{item.quantity}</span>
                          <Badge className={stockStatus.color}>
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4 px-4">
                        <p className="font-medium">{formatCurrency(currentPrice)}</p>
                        {item.price !== item.product.base_price && (
                          <p className="text-xs text-gray-500">Base: {formatCurrency(item.product.base_price)}</p>
                        )}
                      </TableCell>
                      
                      <TableCell className="py-4 px-4">
                        <p className="font-semibold">{formatCurrency(value)}</p>
                      </TableCell>
                      
                      <TableCell className="py-4 px-4">
                        {item.expiry_date ? (
                          <div>
                            <p className="text-sm">{new Date(item.expiry_date).toLocaleDateString()}</p>
                            {new Date(item.expiry_date) < new Date() && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Expired</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(item)}
                          className="h-8 px-3 cursor-pointer bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {filteredInventory.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No inventory items found</p>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Inventory Dialog */}
      <EditInventoryDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={handleEditSuccess}
        inventoryItem={editingItem}
      />
    </div>
  )
}