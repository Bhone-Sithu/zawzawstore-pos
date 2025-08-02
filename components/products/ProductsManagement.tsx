'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import ProductList from './ProductList'
import type { Product } from '@/types/database.types'

export default function ProductsManagement() {
  const router = useRouter()
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
      // You could show a toast notification here instead of alert
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        </div>
        <Button onClick={() => router.push('/admin/products/create')} className="cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Product List Component */}
      <ProductList
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        refreshTrigger={refreshTrigger}
      />

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