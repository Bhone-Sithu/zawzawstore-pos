export interface CreateProductData {
  barcode: string
  name_en: string
  name_mm: string
  category_id?: string | null
  base_price: number
  image?: string | null
}