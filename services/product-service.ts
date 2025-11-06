import { supabase } from '@/lib/supabase'
import type { Category, Product } from '@/types/database.types'
import type { CreateProductData } from '@/types/product.types'

export async function createProduct(data: CreateProductData): Promise<Product> {
  const productData = {
    ...data,
    is_active: true,
    category_id: data.category_id || null,
    image: data.image || null
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) {
    if (error.message?.includes('barcode')) {
      throw new Error('This barcode is already in use')
    }
    throw new Error('Failed to create product. Please try again.')
  }

  return product
}

export async function updateProduct(id: string, data: CreateProductData): Promise<Product> {
  const productData = {
    ...data,
    category_id: data.category_id || null,
    image: data.image || null
  }

  const { data: product, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.message?.includes('barcode')) {
      throw new Error('This barcode is already in use')
    }
    throw new Error('Failed to update product. Please try again.')
  }

  return product
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name_en')

  if (error) {
    throw new Error('Failed to fetch categories')
  }

  return data || []
}

export function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString().slice(-4)
  return timestamp + random
}

export interface ProductWithCategory extends Product {
  category?: Category
}

export interface ProductWithInventory extends ProductWithCategory {
  stock?: number
  branch_id?: string
  price?: number // Inventory-specific price (overrides base_price if set)
}

export interface ProductFilters {
  searchTerm?: string
  categoryId?: string
}

export interface PaginatedProductsResult {
  products: ProductWithCategory[]
  totalCount: number
  totalPages: number
}

export interface PaginatedPOSProductsResult {
  products: ProductWithInventory[]
  totalCount: number
  totalPages: number
}

export async function fetchProductsPaginated(
  page: number = 1,
  itemsPerPage: number = 10,
  filters: ProductFilters = {}
): Promise<PaginatedProductsResult> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `, { count: 'exact' })
    .eq('is_active', true)

  // Apply search filter
  if (filters.searchTerm) {
    query = query.or(`name_en.ilike.%${filters.searchTerm}%,name_mm.ilike.%${filters.searchTerm}%,barcode.ilike.%${filters.searchTerm}%`)
  }

  // Apply category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId)
  }

  // Add pagination
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  const { data, error, count } = await query
    .order('name_en')
    .range(from, to)

  if (error) {
    throw new Error('Failed to fetch products')
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return {
    products: data || [],
    totalCount: count || 0,
    totalPages
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    throw new Error('Failed to delete product')
  }
}

// POS-specific function to fetch products with inventory data for a specific branch
export async function fetchPOSProductsPaginated(
  branchId: string,
  page: number = 1,
  itemsPerPage: number = 10,
  filters: ProductFilters = {}
): Promise<PaginatedPOSProductsResult> {
  try {
    // If no search term, get all products
    if (!filters.searchTerm || !filters.searchTerm.trim()) {
      let query = supabase
        .from('inventory')
        .select(`
          quantity,
          price,
          products!inner(
            id,
            barcode,
            name_en,
            name_mm,
            image,
            base_price,
            supplier_price,
            is_active,
            category_id,
            created_at,
            updated_at
          )
        `, { count: 'exact' })
        .eq('branch_id', branchId)
        .eq('products.is_active', true)

      // Apply category filter
      if (filters.categoryId && filters.categoryId !== 'all') {
        query = query.eq('products.category_id', filters.categoryId)
      }

      // Add pagination
      const offset = (page - 1) * itemsPerPage
      query = query.range(offset, offset + itemsPerPage - 1)
      query = query.order('name_en', { foreignTable: 'products' })

      const { data, error, count } = await query

      if (error) {
        console.error('Database error in fetchPOSProductsPaginated (no search):', error)
        throw new Error(`Failed to fetch POS products: ${error.message}`)
      }

      return await transformProductData(data, count || 0, itemsPerPage, branchId)
    }

    // With search term - try multiple queries and combine results
    const searchTerm = filters.searchTerm.trim()
    const isNumeric = /^\d+$/.test(searchTerm)
    
    let allResults: any[] = []
    let totalCount = 0

    // Search by barcode (exact match)
    if (isNumeric) {
      const barcodeQuery = supabase
        .from('inventory')
        .select(`
          quantity,
          price,
          products!inner(
            id,
            barcode,
            name_en,
            name_mm,
            image,
            base_price,
            supplier_price,
            is_active,
            category_id,
            created_at,
            updated_at
          )
        `)
        .eq('branch_id', branchId)
        .eq('products.is_active', true)
        .eq('products.barcode', searchTerm)

      if (filters.categoryId && filters.categoryId !== 'all') {
        barcodeQuery.eq('products.category_id', filters.categoryId)
      }

      const { data: barcodeData, error: barcodeError } = await barcodeQuery
      if (!barcodeError && barcodeData) {
        allResults.push(...barcodeData)
      }
    }

    // Search by English name
    const enQuery = supabase
      .from('inventory')
      .select(`
        quantity,
        price,
        products!inner(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          supplier_price,
          is_active,
          category_id,
          created_at,
          updated_at
        )
      `)
      .eq('branch_id', branchId)
      .eq('products.is_active', true)
      .ilike('products.name_en', `%${searchTerm}%`)

    if (filters.categoryId && filters.categoryId !== 'all') {
      enQuery.eq('products.category_id', filters.categoryId)
    }

    const { data: enData, error: enError } = await enQuery
    if (!enError && enData) {
      allResults.push(...enData)
    }

    // Search by Myanmar name
    const mmQuery = supabase
      .from('inventory')
      .select(`
        quantity,
        price,
        products!inner(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          supplier_price,
          is_active,
          category_id,
          created_at,
          updated_at
        )
      `)
      .eq('branch_id', branchId)
      .eq('products.is_active', true)
      .ilike('products.name_mm', `%${searchTerm}%`)

    if (filters.categoryId && filters.categoryId !== 'all') {
      mmQuery.eq('products.category_id', filters.categoryId)
    }

    const { data: mmData, error: mmError } = await mmQuery
    if (!mmError && mmData) {
      allResults.push(...mmData)
    }

    // Remove duplicates based on product ID
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.products.id === item.products.id)
    )

    // Apply pagination to combined results
    totalCount = uniqueResults.length
    const offset = (page - 1) * itemsPerPage
    const paginatedResults = uniqueResults.slice(offset, offset + itemsPerPage)

    return await transformProductData(paginatedResults, totalCount, itemsPerPage, branchId)

  } catch (error) {
    console.error('Error in fetchPOSProductsPaginated:', error)
    throw error
  }
}

// Helper function to transform product data
async function transformProductData(data: any[], totalCount: number, itemsPerPage: number, branchId: string) {
  // Get categories separately
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')

  const categoriesMap = new Map()
  if (categoriesData) {
    categoriesData.forEach(cat => categoriesMap.set(cat.id, cat))
  }

  // Transform data to match ProductWithInventory interface
  const productsWithInventory: ProductWithInventory[] = (data || []).map((item: any) => {
    const product = item.products
    return {
      id: product.id,
      barcode: product.barcode,
      name_en: product.name_en,
      name_mm: product.name_mm,
      image: product.image,
      category_id: product.category_id,
      supplier_price: product.supplier_price,
      base_price: product.base_price,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      category: categoriesMap.get(product.category_id),
      stock: item.quantity,
      branch_id: branchId,
      price: item.price || product.base_price // Use inventory price if available, otherwise use base price
    }
  })

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return {
    products: productsWithInventory,
    totalCount: totalCount,
    totalPages
  }
}

// Get product with current stock for POS
export async function getPOSProductByBarcode(barcode: string, branchId: string): Promise<ProductWithInventory | null> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        quantity,
        price,
        products!inner(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          supplier_price,
          is_active,
          category_id,
          created_at,
          updated_at
        )
      `)
      .eq('branch_id', branchId)
      .eq('products.barcode', barcode)
      .eq('products.is_active', true)
      .single()

    if (error || !data) {
      console.log('Product not found by barcode:', barcode)
      return null
    }

    // Get category separately
    let category = null
    const product = (data as any).products
    if (product.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', product.category_id)
        .single()
      category = categoryData
    }
    return {
      id: product.id,
      barcode: product.barcode,
      name_en: product.name_en,
      name_mm: product.name_mm,
      image: product.image,
      category_id: product.category_id,
      supplier_price: product.supplier_price,
      base_price: product.base_price,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      category: category,
      stock: (data as any).quantity,
      branch_id: branchId
    }
  } catch (error) {
    console.error('Error in getPOSProductByBarcode:', error)
    return null
  }
}
