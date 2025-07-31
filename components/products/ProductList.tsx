'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Inventory } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Filter, Edit, Trash2 } from 'lucide-react'

interface ProductWithInventory extends Product {
  category?: Category
  inventory?: Inventory[]
  total_stock?: number
  low_stock?: boolean
}

interface ProductListProps {
  onEditProduct: (product: ProductWithInventory) => void
  onDeleteProduct: (productId: string) => void
  refreshTrigger: number
}

export default function ProductList({ onEditProduct, onDeleteProduct, refreshTrigger }: ProductListProps) {
  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [showLowStock, setShowLowStock] = useState(false)

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
          category:categories(*),
          inventory(*)
        `)
        .eq('is_active', true)
        .order('name_en')

      if (productsError) throw productsError

      const productsWithInventory = productsData?.map(product => {
        const totalStock = product.inventory?.reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0) || 0
        const lowStock = totalStock <= product.low_stock_threshold

        return {
          ...product,
          total_stock: totalStock,
          low_stock: lowStock
        }
      }) || []

      setProducts(productsWithInventory)
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
    const matchesLowStock = !showLowStock || product.low_stock

    return matchesSearch && matchesCategory && matchesLowStock
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Catalog</span>
          <Badge variant="secondary">
            {filteredProducts.length} products
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Search by name, Myanmar name, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 placeholder:text-gray-600"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => setShowLowStock(!showLowStock)}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Low Stock
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{product.name_en}</p>
                      <p className="text-sm text-gray-900">{product.name_mm}</p>
                      <p className="text-xs text-gray-700">#{product.barcode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category?.name_en || 'No Category'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">RM {product.selling_price.toFixed(2)}</p>
                      <p className="text-xs text-gray-700">
                        Cost: RM {product.cost_price.toFixed(2)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className={`font-medium ${product.low_stock ? 'text-destructive' : ''}`}>
                        {product.total_stock} units
                      </p>
                      <p className="text-xs text-gray-700">
                        Alert: ≤{product.low_stock_threshold}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.low_stock ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="secondary">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteProduct(product.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-700">
              <p>No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}