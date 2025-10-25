'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Pagination from '@/components/ui/pagination'
import { useProductsPagination } from '@/hooks/use-products-pagination'
import type { ProductWithCategory } from '@/services/product-service'
import { useReceiptPrinter } from '@/contexts/ReceiptPrinterContext'
import { QuantityDialog } from '@/components/ui/quantity-dialog'
import { Loader2, Edit, Trash2, Search, Printer } from 'lucide-react'

interface ProductListProps {
  onEditProduct: (product: ProductWithCategory) => void
  onDeleteProduct: (product: ProductWithCategory) => void
  refreshTrigger: number
}

export default function ProductList({ onEditProduct, onDeleteProduct, refreshTrigger }: ProductListProps) {
  const {
    products,
    categories,
    loading,
    currentPage,
    totalPages,
    searchInput,
    activeSearchTerm,
    filterCategory,
    setCurrentPage,
    setSearchInput,
    setFilterCategory,
    handleSearch,
    clearSearch,
    showingFrom,
    showingTo,
    totalCount
  } = useProductsPagination(refreshTrigger)

  const { printBarcodeSticker, isConnected, currentMethod, connectPrinter } = useReceiptPrinter()
  const [quantityDialog, setQuantityDialog] = useState<{
    isOpen: boolean
    product: ProductWithCategory | null
    printing: boolean
  }>({
    isOpen: false,
    product: null,
    printing: false
  })

  const handlePrintSticker = (product: ProductWithCategory) => {
    console.log('Print button clicked for product:', product.name_en)
    setQuantityDialog({
      isOpen: true,
      product,
      printing: false
    })
  }

  const handleQuantityConfirm = async (quantity: number) => {
    if (!quantityDialog.product) return
    
    setQuantityDialog(prev => ({ ...prev, printing: true }))
    
    try {
      console.log(`Printing ${quantity} stickers for:`, quantityDialog.product.name_en)
      console.log('Printer status - Connected:', isConnected, 'Method:', currentMethod)
      
      const result = await printBarcodeSticker({
        name_en: quantityDialog.product.name_en,
        base_price: quantityDialog.product.base_price,
        barcode: quantityDialog.product.barcode
      }, quantity)
      
      console.log('Print result:', result)
      
      if (result) {
        alert(`${quantity} sticker${quantity > 1 ? 's' : ''} printed successfully!`)
      }
      
      setQuantityDialog({ isOpen: false, product: null, printing: false })
    } catch (error) {
      console.error('Failed to print barcode sticker:', error)
      alert(`Printing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setQuantityDialog(prev => ({ ...prev, printing: false }))
    }
  }

  const handleQuantityCancel = () => {
    if (!quantityDialog.printing) {
      setQuantityDialog({ isOpen: false, product: null, printing: false })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="flex-1">
                <BarcodeInput
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Search by name, Myanmar name, or scan/type barcode..."
                  className="w-full"
                  onScan={(barcode) => {
                    // Auto search on barcode scan
                    handleSearch(barcode)
                  }}
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                size="default"
              >
                <Search className="h-4 w-4" />
              </Button>
              {activeSearchTerm && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="cursor-pointer"
                  size="default"
                >
                  Clear
                </Button>
              )}
            </div>
            {activeSearchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                Searching for: <span className="font-medium">&quot;{activeSearchTerm}&quot;</span>
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-60 overflow-auto">
                <SelectItem value="all" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id} className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">
                    {category.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Printer Status Bar */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
                <span className="text-sm font-medium">
                  Printer Status: {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                Method: {currentMethod.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            {!isConnected && (
              <Button
                onClick={connectPrinter}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-1" />
                Connect Printer
              </Button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Image</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Product</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Category</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Supplier Price</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Base Price</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right cursor-pointer">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <TableCell className="py-4 px-4">
                      {product.image ? (
                        <Image 
                          src={product.image} 
                          alt={product.name_en}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{product.name_en}</p>
                        <p className="text-sm text-gray-600">{product.name_mm}</p>
                        <p className="text-xs text-gray-500">ID: {product.barcode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {product.category?.name_en || 'No Category'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      {product.supplier_price ? (
                        <p className="font-medium text-gray-700">RM {product.supplier_price.toFixed(2)}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not set</p>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <p className="font-semibold text-gray-900">RM {product.base_price.toFixed(2)}</p>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintSticker(product)}
                          className="h-8 px-3 bg-orange-50 cursor-pointer border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300 hover:text-orange-700 transition-all duration-200"
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditProduct(product)}
                          className="h-8 px-3 bg-blue-50 cursor-pointer border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteProduct(product)}
                          className="h-8 px-3 bg-red-50 cursor-pointer border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {products.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 bg-white">
                <p>No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalItems={totalCount}
            />
          </div>
        )}
      </CardContent>

      {/* Quantity Dialog */}
      <QuantityDialog
        isOpen={quantityDialog.isOpen}
        onClose={handleQuantityCancel}
        onConfirm={handleQuantityConfirm}
        productName={quantityDialog.product?.name_en || ''}
        loading={quantityDialog.printing}
      />
    </Card>
  )
}