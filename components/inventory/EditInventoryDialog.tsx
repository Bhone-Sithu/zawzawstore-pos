'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import type { InventoryItem } from '@/types/inventory.types'
import * as inventoryService from '@/services/inventory-service'

interface EditInventoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  inventoryItem: InventoryItem | null
}

export default function EditInventoryDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  inventoryItem 
}: EditInventoryDialogProps) {
  const [quantity, setQuantity] = useState<number>(0)
  const [price, setPrice] = useState<number | undefined>()
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (inventoryItem) {
      setQuantity(inventoryItem.quantity)
      setPrice(inventoryItem.price || inventoryItem.product.base_price)
      setExpiryDate(inventoryItem.expiry_date ? inventoryItem.expiry_date.split('T')[0] : '')
      setMessage(null)
    }
  }, [inventoryItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inventoryItem || quantity < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Update inventory with new values
      const { error } = await inventoryService.updateInventoryRecord(
        inventoryItem.id,
        quantity,
        price,
        expiryDate || undefined
      )

      if (error) {
        throw new Error(error)
      }

      setMessage({ type: 'success', text: 'Inventory updated successfully' })
      
      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update inventory' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMessage(null)
    onClose()
  }

  if (!inventoryItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Inventory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {inventoryItem.product.image ? (
                <Image 
                  src={inventoryItem.product.image} 
                  alt={inventoryItem.product.name_en}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover rounded border"
                  unoptimized={true}
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{inventoryItem.product.name_en}</h3>
                <p className="text-sm text-gray-600">{inventoryItem.product.name_mm}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Barcode: {inventoryItem.product.barcode}</span>
              <span className="text-gray-600">Branch: {inventoryItem.branch.name}</span>
            </div>
            {inventoryItem.product.category && (
              <Badge variant="outline" className="mt-2">
                {inventoryItem.product.category.name_en}
              </Badge>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {inventoryItem.quantity} units
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (RM)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || undefined)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base price: RM {inventoryItem.product.base_price.toFixed(2)}
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="cursor-pointer"
              />
              {inventoryItem.expiry_date && (
                <p className="text-xs text-gray-500 mt-1">
                  Current: {new Date(inventoryItem.expiry_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Inventory'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}