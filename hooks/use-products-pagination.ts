import { useState, useEffect, useCallback } from 'react'
import { fetchProductsPaginated, fetchCategories, deleteProduct } from '@/services/product-service'
import type { ProductWithCategory, ProductFilters } from '@/services/product-service'
import type { Category } from '@/types/database.types'

interface UseProductsPaginationReturn {
  products: ProductWithCategory[]
  categories: Category[]
  loading: boolean
  currentPage: number
  totalPages: number
  totalCount: number
  searchInput: string
  activeSearchTerm: string
  filterCategory: string
  setCurrentPage: (page: number) => void
  setSearchInput: (term: string) => void
  setFilterCategory: (category: string) => void
  handleSearch: (term?: string) => void
  clearSearch: () => void
  handleDeleteProduct: (productId: string) => Promise<void>
  refreshProducts: () => void
  showingFrom: number
  showingTo: number
}

const ITEMS_PER_PAGE = 10

export function useProductsPagination(refreshTrigger: number = 0): UseProductsPaginationReturn {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await fetchCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  // Load products with pagination
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      
      const filters: ProductFilters = {
        searchTerm: activeSearchTerm || undefined,
        categoryId: filterCategory
      }

      const result = await fetchProductsPaginated(currentPage, ITEMS_PER_PAGE, filters)
      
      setProducts(result.products)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, activeSearchTerm, filterCategory])

  // Handle product deletion
  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteProduct(productId)
      // Refresh products after deletion
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }, [loadProducts])

  // Handle search functionality
  const handleSearch = useCallback((term?: string) => {
    const searchTerm = term !== undefined ? term : searchInput
    setActiveSearchTerm(searchTerm)
    if (term !== undefined) {
      setSearchInput(term)
    }
    setCurrentPage(1)
  }, [searchInput])

  const clearSearch = useCallback(() => {
    setSearchInput('')
    setActiveSearchTerm('')
    setCurrentPage(1)
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeSearchTerm, filterCategory])

  // Load categories on mount and refresh trigger
  useEffect(() => {
    loadCategories()
  }, [loadCategories, refreshTrigger])

  // Load products when dependencies change
  useEffect(() => {
    loadProducts()
  }, [loadProducts, refreshTrigger])

  // Calculate showing range
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)

  const refreshProducts = useCallback(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    categories,
    loading,
    currentPage,
    totalPages,
    totalCount,
    searchInput,
    activeSearchTerm,
    filterCategory,
    setCurrentPage,
    setSearchInput,
    setFilterCategory,
    handleSearch,
    clearSearch,
    handleDeleteProduct,
    refreshProducts,
    showingFrom,
    showingTo
  }
}