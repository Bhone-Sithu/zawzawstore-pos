'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Edit, Trash2 } from 'lucide-react'

interface ProductWithCategory extends Product {
  category?: Category
}

interface ProductListProps {
  onEditProduct: (product: ProductWithCategory) => void
  onDeleteProduct: (product: ProductWithCategory) => void
  refreshTrigger: number
}

export default function ProductList({ onEditProduct, onDeleteProduct, refreshTrigger }: ProductListProps) {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [refreshTrigger])

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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('name_en')

      if (productsError) throw productsError

      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.name_mm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm)
    
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory

    return matchesSearch && matchesCategory
  })

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
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search by name, Myanmar name, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white placeholder:text-gray-600 cursor-pointer"
            />
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

        {/* Products Table */}
       
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Image</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Product</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Base Price</TableHead>
                <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right cursor-pointer">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <TableCell className="py-4 px-4">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name_en}
                        className="w-12 h-12 object-cover rounded border border-gray-200"
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
                    <p className="font-semibold text-gray-900">RM {product.base_price.toFixed(2)}</p>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
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
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white">
                  <p>No products found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
      </CardContent>
    </Card>
  )
}