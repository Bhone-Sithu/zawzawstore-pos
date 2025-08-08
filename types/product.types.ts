export interface CreateProductData {
  barcode: string
  name_en: string
  name_mm: string
  category_id?: string | null
  supplier_price?: number | null
  base_price: number
  image?: string | null
}