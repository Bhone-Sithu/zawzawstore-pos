import { useState, useEffect, useCallback } from 'react'
import { fetchPOSProductsPaginated, fetchCategories, getPOSProductByBarcode } from '@/services/product-service'
import type { ProductWithInventory, ProductFilters } from '@/services/product-service'
import type { Category } from '@/types/database.types'

interface UsePOSProductsReturn {
  products: ProductWithInventory[]
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
  refreshProducts: () => void
  showingFrom: number
  showingTo: number
  getProductByBarcode: (barcode: string) => Promise<ProductWithInventory | null>
  updateProductStock: (productId: string, quantityChange: number) => void
}

const ITEMS_PER_PAGE = 12 // Slightly more for POS display

export function usePOSProducts(branchId: string, refreshTrigger: number = 0): UsePOSProductsReturn {
  const [products, setProducts] = useState<ProductWithInventory[]>([])
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

  // Load products with inventory data
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      
      const filters: ProductFilters = {
        searchTerm: activeSearchTerm || undefined,
        categoryId: filterCategory
      }

      const result = await fetchPOSProductsPaginated(branchId, currentPage, ITEMS_PER_PAGE, filters)
      
      setProducts(result.products)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error loading POS products:', error)
      setProducts([])
      setTotalCount(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [branchId, currentPage, activeSearchTerm, filterCategory])

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

  // Get product by barcode with stock info
  const getProductByBarcode = useCallback(async (barcode: string): Promise<ProductWithInventory | null> => {
    try {
      return await getPOSProductByBarcode(barcode, branchId)
    } catch (error) {
      console.error('Error fetching product by barcode:', error)
      return null
    }
  }, [branchId])

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

  // Optimistic stock update - update local state immediately
  const updateProductStock = useCallback((productId: string, quantityChange: number) => {
    setProducts(prevProducts => 
      prevProducts.map(product => {
        if (product.id === productId) {
          const newStock = Math.max(0, (product.stock || 0) + quantityChange)
          return {
            ...product,
            stock: newStock
          }
        }
        return product
      })
    )
  }, [])

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
    refreshProducts,
    showingFrom,
    showingTo,
    getProductByBarcode,
    updateProductStock
  }
}