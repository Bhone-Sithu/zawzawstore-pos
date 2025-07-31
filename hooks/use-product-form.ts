import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createProduct, generateBarcode } from '@/services/product-service'
import { productFormSchema, type ProductFormSchema } from '@/schemas/product.schema'
import type { CreateProductData } from '@/types/product.types'

const defaultValues: ProductFormSchema = {
  name_en: '',
  name_mm: '',
  category_id: '',
  base_price: 0,
  expiry_date: '',
  barcode: ''
}

export function useProductForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues
  })

  const handleGenerateBarcode = () => {
    const barcode = generateBarcode()
    form.setValue('barcode', barcode)
    form.clearErrors('barcode')
  }

  const clearForm = () => {
    form.reset(defaultValues)
    setSubmitError(null)
  }

  const submitForm = async (data: ProductFormSchema): Promise<boolean> => {
    setLoading(true)
    setSubmitError(null)

    try {
      const productData: CreateProductData = {
        barcode: data.barcode,
        name_en: data.name_en,
        name_mm: data.name_mm,
        category_id: data.category_id || null,
        base_price: data.base_price,
        expiry_date: data.expiry_date || null
      }

      await createProduct(productData)
      router.push('/admin/products')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
      
      if (errorMessage.includes('barcode')) {
        form.setError('barcode', { message: errorMessage })
      } else {
        setSubmitError(errorMessage)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    loading,
    submitError,
    generateBarcode: handleGenerateBarcode,
    clearForm,
    submitForm
  }
}