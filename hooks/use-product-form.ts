import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createProduct, updateProduct, generateBarcode, reactivateProduct } from '@/services/product-service'
import { productFormSchema, type ProductFormSchema } from '@/schemas/product.schema'
import { uploadImageFile } from '@/lib/storage'
import type { CreateProductData } from '@/types/product.types'
import type { Product } from '@/types/database.types'

const defaultValues: ProductFormSchema = {
  name_en: '',
  name_mm: '',
  category_id: '',
  supplier_price: 0,
  base_price: 0,
  barcode: ''
}

interface ReactivationData {
  productId: string
  productName: string
  message: string
}

export function useProductForm(editProduct?: Product | null) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [reactivationDialog, setReactivationDialog] = useState<ReactivationData | null>(null)
  const isEditMode = !!editProduct

  const form = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues
  })

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      form.reset({
        name_en: editProduct.name_en,
        name_mm: editProduct.name_mm,
        category_id: editProduct.category_id || '',
        supplier_price: editProduct.supplier_price || 0,
        base_price: editProduct.base_price,
        barcode: editProduct.barcode
      })
    }
  }, [editProduct, form])

  const handleGenerateBarcode = () => {
    const barcode = generateBarcode()
    form.setValue('barcode', barcode)
    form.clearErrors('barcode')
  }

  const clearForm = () => {
    form.reset(defaultValues)
    setSubmitError(null)
    setImageFile(null)
    setReactivationDialog(null)
  }

  const handleReactivateProduct = async (productId: string, updateData: CreateProductData): Promise<boolean> => {
    setLoading(true)
    setSubmitError(null)
    
    try {
      await reactivateProduct(productId, updateData)
      router.push('/admin/products')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate product'
      setSubmitError(errorMessage)
      return false
    } finally {
      setLoading(false)
      setReactivationDialog(null)
    }
  }

  const submitForm = async (data: ProductFormSchema): Promise<boolean> => {
    setLoading(true)
    setSubmitError(null)

    try {
      let imageUrl: string | null = editProduct?.image || null

      // Upload image if file was selected
      if (imageFile) {
        const result = await uploadImageFile(imageFile, 'products')
        if (result.error) {
          setSubmitError(result.error)
          return false
        }
        imageUrl = result.url
      }

      const productData: CreateProductData = {
        barcode: data.barcode,
        name_en: data.name_en,
        name_mm: data.name_mm,
        category_id: data.category_id || null,
        supplier_price: data.supplier_price || null,
        base_price: data.base_price,
        image: imageUrl
      }

      if (isEditMode && editProduct) {
        await updateProduct(editProduct.id, productData)
      } else {
        await createProduct(productData)
      }
      
      router.push('/admin/products')
      return true
    } catch (error) {
      // Handle reactivation scenario
      if (error instanceof Error && error.name === 'REACTIVATE_PRODUCT') {
        setReactivationDialog({
          productId: (error as any).productId,
          productName: (error as any).productName,
          message: error.message
        })
        return false
      }

      const errorMessage = error instanceof Error ? error.message : 
        isEditMode ? 'Failed to update product' : 'Failed to create product'
      
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
    imageFile,
    setImageFile,
    generateBarcode: handleGenerateBarcode,
    clearForm,
    submitForm,
    reactivationDialog,
    setReactivationDialog,
    handleReactivateProduct
  }
}