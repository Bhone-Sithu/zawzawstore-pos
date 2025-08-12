'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import ProductList from '@/components/products/ProductList'
import LoadingSpinner from '@/components/ui/loading-spinner'
import type { Product } from '@/types/database.types'

export default function ProductsPage() {
  const router = useRouter()
  const { isAuthorized, isLoading: authLoading } = useAuth('admin')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    productId: string | null
    productName: string
  }>({
    isOpen: false,
    productId: null,
    productName: ''
  })
  const [deleting, setDeleting] = useState(false)

  const handleEditProduct = (product: Product) => {
    router.push(`/admin/products/create?edit=${product.id}`)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteDialog({
      isOpen: true,
      productId: product.id,
      productName: product.name_en
    })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.productId) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', deleteDialog.productId)

      if (error) throw error
      
      setRefreshTrigger(prev => prev + 1)
      setDeleteDialog({ isOpen: false, productId: null, productName: '' })
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const closeDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialog({ isOpen: false, productId: null, productName: '' })
    }
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-sm text-gray-500">Manage your product catalog</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/admin/products/create')} 
              className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto ">
          <div className="p-6">
            <ProductList
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              refreshTrigger={refreshTrigger}
            />
          </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteDialog.productName}"? This action cannot be undone and will deactivate the product from your catalog.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}