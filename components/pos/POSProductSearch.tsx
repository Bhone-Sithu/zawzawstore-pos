'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { usePOSProducts } from '@/hooks/use-pos-products'
import { Plus, Search, ShoppingCart, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

interface POSProductSearchProps {
  branchId: string
  onAddToCart: (product: {
    id: string
    barcode: string
    name_en: string
    name_mm: string
    base_price: number
    image?: string
    stock?: number
    price?: number
  }) => void
}

export default function POSProductSearch({ branchId, onAddToCart }: POSProductSearchProps) {
  const {
    products,
    categories,
    loading,
    searchInput,
    filterCategory,
    currentPage,
    totalPages,
    totalCount,
    showingFrom,
    showingTo,
    setCurrentPage,
    setSearchInput,
    setFilterCategory,
    handleSearch,
    clearSearch,
    getProductByBarcode
  } = usePOSProducts(branchId)

  const handleProductAdd = (product: {
    id: string
    barcode: string
    name_en: string
    name_mm: string
    base_price: number
    image?: string
    stock?: number
    category?: { name_en: string }
  }) => {
    // Don't add if no stock available
    if (!product.stock || product.stock <= 0) {
      return
    }

    onAddToCart({
      ...product,
      stock: product.stock,
      price: product.base_price
    })
  }

  // Handle barcode scan
  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return
    
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        handleProductAdd(product)
        // Clear the search after successful scan
        clearSearch()
      }
    } catch (error) {
      console.error('Error searching product by barcode:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Controls */}
      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <BarcodeInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search products or scan barcode..."
              className="h-12 text-lg"
              onScan={handleBarcodeSearch}
            />
          </div>
          <Button 
            onClick={() => handleSearch()}
            className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
          {searchInput && (
            <Button 
              onClick={clearSearch}
              variant="outline"
              className="h-12 px-6 cursor-pointer"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
            className={`cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'hover:bg-orange-50'
            }`}
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={filterCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(category.id)}
              className={`cursor-pointer ${
                filterCategory === category.id
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'hover:bg-orange-50'
              }`}
            >
              {category.name_en}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
              {products.map(product => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group flex flex-col h-full"
                >
                  {/* Product Image */}
                  <div className="aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name_en}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[1.5em]">
                        {product.name_en}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1 min-h-[2em]">
                        {product.name_mm}
                      </p>
                      
                      {/* Category & Price */}
                      <div className="flex flex-col items-start justify-between gap-2 min-h-[3rem]">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                          {product.category?.name_en || 'No Category'}
                        </Badge>
                        <div className="text-left">
                          <p className="text-lg font-bold text-orange-600">
                            RM {product.base_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 break-all mb-1">
                            ID: {product.barcode}
                          </p>
                          <div className="flex items-center gap-1">
                            {product.stock && product.stock > 0 ? (
                              <Badge variant="outline" className={`text-xs ${
                                product.stock <= 3 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                Stock: {product.stock}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                                Out of Stock
                              </Badge>
                            )}
                            {product.stock && product.stock <= 3 && product.stock > 0 && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Button - Always at bottom */}
                    <Button
                      onClick={() => handleProductAdd(product)}
                      disabled={!product.stock || product.stock <= 0}
                      className={`w-full h-10 transition-colors duration-200 !border-0 ${
                        !product.stock || product.stock <= 0
                          ? '!bg-gray-300 !text-gray-500 cursor-not-allowed'
                          : '!bg-orange-500 hover:!bg-orange-600 focus:!bg-orange-600 active:!bg-orange-700 !text-white cursor-pointer'
                      }`}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  Showing {showingFrom} to {showingTo} of {totalCount} products
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
                      if (pageNum > totalPages) return null
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className={`cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'hover:bg-orange-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}