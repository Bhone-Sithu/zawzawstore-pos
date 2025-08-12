'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus, ShoppingCart, X } from 'lucide-react'

interface CartItem {
  id: string
  barcode: string
  name_en: string
  name_mm: string
  price: number
  quantity: number
  stock: number
  image?: string
}

interface POSCartProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
}

export default function POSCart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: POSCartProps) {
  
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Cart is empty</p>
        <p className="text-sm">Add products to get started</p>
      </div>
    )
  }

  const handleQuantityChange = (itemId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity) || 0
    onUpdateQuantity(itemId, quantity)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'} in cart
        </p>
        <Button
          onClick={onClearCart}
          variant="outline"
          size="sm"
          className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-3">
              {/* Product Image */}
              <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name_en}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ShoppingCart className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.name_en}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {item.name_mm}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {item.barcode}
                </p>
                
                {/* Price */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-orange-600">
                    RM {item.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {item.stock}
                  </p>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                onClick={() => onRemoveItem(item.id)}
                variant="ghost"
                size="sm"
                className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  variant="outline"
                  size="sm"
                  disabled={item.quantity <= 1}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  min="1"
                  max={item.stock}
                  className="w-16 h-8 text-center"
                />
                
                <Button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  variant="outline"
                  size="sm"
                  disabled={item.quantity >= item.stock}
                  className="h-8 w-8 p-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Line Total */}
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  RM {(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} × RM {item.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}