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

export interface ProductFilters {
  searchTerm?: string
  categoryId?: string
}

export interface PaginatedProductsResult {
  products: ProductWithCategory[]
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
