'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useProductForm } from '@/hooks/use-product-form'
import { useCategories } from '@/hooks/use-categories'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProductFormFields from '@/components/products/ProductFormFields'
import ImageUploadSection from '@/components/products/ImageUploadSection'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database.types'
import type { CreateProductData } from '@/types/product.types'
import { uploadImageFile } from '@/lib/storage'

export default function CreateProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId
  
  const { isAuthorized, isLoading: authLoading } = useAuth('admin')
  const { categories } = useCategories()
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(isEditMode)
  
  const {
    form,
    loading,
    submitError,
    imageFile,
    setImageFile,
    generateBarcode,
    clearForm,
    submitForm,
    reactivationDialog,
    setReactivationDialog,
    handleReactivateProduct
  } = useProductForm(editProduct)

  // Load product for editing
  useEffect(() => {
    if (isEditMode && editId) {
      const loadProduct = async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', editId)
            .single()

          if (error) throw error
          setEditProduct(data)
        } catch (error) {
          console.error('Error loading product:', error)
          router.push('/admin/products')
        } finally {
          setLoadingProduct(false)
        }
      }

      loadProduct()
    }
  }, [isEditMode, editId, router])


  const handleSubmit = form.handleSubmit(submitForm)

  const handleCancel = () => {
    router.push('/admin/products')
  }

  const handleConfirmReactivation = async () => {
    if (!reactivationDialog) return

    const formData = form.getValues()
    
    let imageUrl: string | null = null
    if (imageFile) {
      const result = await uploadImageFile(imageFile, 'products')
      if (result.error) {
        alert('Failed to upload image')
        return
      }
      imageUrl = result.url
    }

    const productData: CreateProductData = {
      barcode: formData.barcode,
      name_en: formData.name_en,
      name_mm: formData.name_mm,
      category_id: formData.category_id || null,
      supplier_price: formData.supplier_price || null,
      base_price: formData.base_price,
      image: imageUrl
    }

    await handleReactivateProduct(reactivationDialog.productId, productData)
  }

  const handleCancelReactivation = () => {
    setReactivationDialog(null)
  }

  if (authLoading || loadingProduct) {
    return <LoadingSpinner />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Edit Product' : 'Create Product'}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </div>

        <Form {...form}>
          <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* General Information */}
            <div className="lg:col-span-2">
              <ProductFormFields
                form={form}
                categories={categories}
                onGenerateBarcode={generateBarcode}
              />
            </div>

            {/* Upload Images */}
            <div className="lg:col-span-1">
              <ImageUploadSection 
                file={imageFile}
                existingImage={editProduct?.image}
                onChange={setImageFile}
                disabled={loading}
              />
            </div>
          </form>
        </Form>

        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}
      </main>

      {/* Reactivation Confirmation Dialog */}
      <Dialog open={!!reactivationDialog} onOpenChange={() => setReactivationDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Deleted Product?</DialogTitle>
            <DialogDescription>
              {reactivationDialog?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelReactivation}
              disabled={loading}
            >
              No, Create New Product
            </Button>
            <Button
              onClick={handleConfirmReactivation}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? 'Reactivating...' : 'Yes, Reactivate Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}