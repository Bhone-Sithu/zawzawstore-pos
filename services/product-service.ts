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

