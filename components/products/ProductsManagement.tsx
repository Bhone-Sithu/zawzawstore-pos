'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, MoreHorizontal, Eye } from 'lucide-react'
import type { ProductWithCategory, Category } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function ProductsManagement() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name_en)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_mm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => router.push('/admin/products/create')}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Select defaultValue="sort">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sort">Sort by...</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select defaultValue="any-price">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-price">Any price</SelectItem>
                  <SelectItem value="under-10">Under RM 10</SelectItem>
                  <SelectItem value="10-50">RM 10 - RM 50</SelectItem>
                  <SelectItem value="50-100">RM 50 - RM 100</SelectItem>
                  <SelectItem value="over-100">Over RM 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search and Clear Buttons */}
            <div className="flex gap-2">
              <Button>Search</Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Count */}
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Products ({filteredProducts.length})
        </p>
        <p className="text-muted-foreground text-sm">
          Page {currentPage} of {totalPages}
        </p>
      </div>

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading products...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <TableCell>
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name_en}</div>
                      <div className="text-sm text-muted-foreground">ID: {product.barcode}</div>
                    </div>
                  </TableCell>
                  <TableCell>admin</TableCell>
                  <TableCell>{product.categories?.name_en || 'No category'}</TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">RM {product.selling_price.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Qty: 1</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      New
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>M</div>
                    <div className="text-xs text-muted-foreground">Standard</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      0
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      ❤️ 0
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>1 day ago</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}