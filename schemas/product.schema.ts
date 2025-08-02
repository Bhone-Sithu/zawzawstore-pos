import { z } from 'zod'

export const productFormSchema = z.object({
  name_en: z
    .string()
    .min(1, 'English name is required')
    .max(200, 'English name must be less than 200 characters'),
  
  name_mm: z
    .string()
    .min(1, 'Myanmar name is required')
    .max(200, 'Myanmar name must be less than 200 characters'),
  
  category_id: z
    .string()
    .min(1, 'Category is required'),
  
  base_price: z
    .number()
    .min(0.01, 'Base price must be greater than 0')
    .max(999999.99, 'Base price is too high'),
  
  barcode: z
    .string()
    .min(1, 'Barcode is required')
    .max(50, 'Barcode must be less than 50 characters')
})

export type ProductFormSchema = z.infer<typeof productFormSchema>