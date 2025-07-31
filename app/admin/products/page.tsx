'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, MoreHorizontal, Eye } from 'lucide-react'
import type { ProductWithCategory, Category } from '@/types/database.types'

export default function ProductsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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
        fetchProducts()
        fetchCategories()
      } catch (error) {
        console.error('Error checking permissions:', error)
        setIsAuthorized(false)
        router.push('/access-denied')
      }
    }

    checkPermissions()
  }, [user, isLoaded, router])

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Products</h2>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <button
            onClick={() => router.push('/admin/products/create')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option>Sort by...</option>
                  <option>Name A-Z</option>
                  <option>Name Z-A</option>
                  <option>Price Low-High</option>
                  <option>Price High-Low</option>
                  <option>Newest First</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option>Any price</option>
                  <option>Under RM 10</option>
                  <option>RM 10 - RM 50</option>
                  <option>RM 50 - RM 100</option>
                  <option>Over RM 100</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Per Page</label>
                <select className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </div>
            </div>

            {/* Search and Clear Buttons */}
            <div className="flex gap-2">
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                Search
              </button>
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Products Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Products ({filteredProducts.length})
          </p>
          <p className="text-gray-500 text-sm">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        <span className="ml-2 text-gray-500">Loading products...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name_en}</div>
                          <div className="text-sm text-gray-500">ID: {product.barcode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        admin
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.categories?.name_en || 'No category'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">RM {product.selling_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Qty: 1</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          New
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>M</div>
                        <div className="text-xs text-gray-400">Standard</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          0
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          ❤️ 0
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>1 day ago</div>
                        <div className="text-xs text-gray-400">
                          {new Date(product.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    page === currentPage
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  )
}