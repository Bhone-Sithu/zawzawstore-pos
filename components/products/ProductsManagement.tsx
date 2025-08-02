'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductList from './ProductList'
import type { Product } from '@/types/database.types'

export default function ProductsManagement() {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEditProduct = (product: Product) => {
    router.push(`/admin/products/create?edit=${product.id}`)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId)

      if (error) throw error
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => router.push('/admin/products/create')}>
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
    </div>
  )
}