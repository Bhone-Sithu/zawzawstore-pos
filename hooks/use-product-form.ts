import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, generateBarcode } from '@/services/product-service'
import type { CreateProductData, ProductFormData, ProductFormErrors } from '@/types/product.types'

const initialFormData: ProductFormData = {
  name_en: '',
  name_mm: '',
  category_id: '',
  base_price: 0,
  expiry_date: '',
  barcode: ''
}

export function useProductForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {}

    if (!formData.name_en.trim()) {
      newErrors.name_en = 'English name is required'
    }
    if (!formData.name_mm.trim()) {
      newErrors.name_mm = 'Myanmar name is required'
    }
    if (formData.base_price <= 0) {
      newErrors.base_price = 'Base price must be greater than 0'
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode = 'Barcode is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateField = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleGenerateBarcode = () => {
    const barcode = generateBarcode()
    updateField('barcode', barcode)
  }

  const clearForm = () => {
    setFormData(initialFormData)
    setErrors({})
  }

  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) return false

    setLoading(true)
    try {
      const productData: CreateProductData = {
        barcode: formData.barcode,
        name_en: formData.name_en,
        name_mm: formData.name_mm,
        category_id: formData.category_id || null,
        base_price: Number(formData.base_price),
        expiry_date: formData.expiry_date || null
      }

      await createProduct(productData)
      router.push('/admin/products')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
      
      if (errorMessage.includes('barcode')) {
        setErrors({ barcode: errorMessage })
      } else {
        setErrors({ general: errorMessage })
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    errors,
    loading,
    updateField,
    generateBarcode: handleGenerateBarcode,
    clearForm,
    submitForm
  }
}