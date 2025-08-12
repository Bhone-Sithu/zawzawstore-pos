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
  let query = supabase
    .from('inventory')
    .select(`
      quantity,
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
        updated_at,
        categories(
          id,
          name_en,
          name_mm
        )
      )
    `, { count: 'exact' })
    .eq('branch_id', branchId)
    .eq('products.is_active', true)

  // Apply category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    query = query.eq('products.category_id', filters.categoryId)
  }

  // Apply search filter
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const searchTerm = filters.searchTerm.trim()
    query = query.or(`products.name_en.ilike.%${searchTerm}%,products.name_mm.ilike.%${searchTerm}%,products.barcode.ilike.%${searchTerm}%`)
  }

  // Add pagination
  const offset = (page - 1) * itemsPerPage
  query = query.range(offset, offset + itemsPerPage - 1)

  // Order by product name
  query = query.order('name_en', { foreignTable: 'products' })

  const { data, error, count } = await query

  if (error) {
    throw new Error('Failed to fetch POS products')
  }

  // Transform data to match ProductWithInventory interface
  const productsWithInventory: ProductWithInventory[] = (data || []).map((item: any) => ({
    id: item.products.id,
    barcode: item.products.barcode,
    name_en: item.products.name_en,
    name_mm: item.products.name_mm,
    image: item.products.image,
    category_id: item.products.category_id,
    supplier_price: item.products.supplier_price,
    base_price: item.products.base_price,
    is_active: item.products.is_active,
    created_at: item.products.created_at,
    updated_at: item.products.updated_at,
    category: item.products.categories,
    stock: item.quantity,
    branch_id: branchId
  }))

  const totalPages = Math.ceil((count || 0) / itemsPerPage)

  return {
    products: productsWithInventory,
    totalCount: count || 0,
    totalPages
  }
}

// Get product with current stock for POS
export async function getPOSProductByBarcode(barcode: string, branchId: string): Promise<ProductWithInventory | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      quantity,
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
        updated_at,
        categories(
          id,
          name_en,
          name_mm
        )
      )
    `)
    .eq('branch_id', branchId)
    .eq('products.barcode', barcode)
    .eq('products.is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: (data as any).products.id,
    barcode: (data as any).products.barcode,
    name_en: (data as any).products.name_en,
    name_mm: (data as any).products.name_mm,
    image: (data as any).products.image,
    category_id: (data as any).products.category_id,
    supplier_price: (data as any).products.supplier_price,
    base_price: (data as any).products.base_price,
    is_active: (data as any).products.is_active,
    created_at: (data as any).products.created_at,
    updated_at: (data as any).products.updated_at,
    category: (data as any).products.categories,
    stock: (data as any).quantity,
    branch_id: branchId
  }
}
