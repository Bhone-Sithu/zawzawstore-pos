'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QuantityDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (quantity: number) => void
  productName: string
  loading?: boolean
}

export function QuantityDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName, 
  loading = false 
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState(1)

  const handleConfirm = () => {
    if (quantity > 0 && quantity <= 100) {
      onConfirm(quantity)
    }
  }

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 1 && num <= 100) {
      setQuantity(num)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleConfirm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Print Barcode Stickers</DialogTitle>
          <DialogDescription>
            How many stickers would you like to print for "{productName}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity:
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="col-span-3 cursor-pointer"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            Maximum 100 stickers per print job
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={loading || quantity < 1 || quantity > 100}
            className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Printing...
              </>
            ) : (
              `Print ${quantity} ${quantity === 1 ? 'Sticker' : 'Stickers'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}