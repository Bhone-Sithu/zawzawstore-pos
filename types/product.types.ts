export interface CreateProductData {
  barcode: string
  name_en: string
  name_mm: string
  category_id?: string | null
  base_price: number
  expiry_date?: string | null
  image?: string | null
}

export interface ProductFormData {
  name_en: string
  name_mm: string
  category_id: string
  base_price: number
  expiry_date: string
  barcode: string
}

export interface ProductFormErrors {
  [key: string]: string
}