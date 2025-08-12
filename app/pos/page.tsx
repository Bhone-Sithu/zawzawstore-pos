'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import LoadingSpinner from '@/components/ui/loading-spinner'
import POSProductSearch from '@/components/pos/POSProductSearch'
import POSCart from '@/components/pos/POSCart'
import POSHeader from '@/components/pos/POSHeader'
import POSStats from '@/components/pos/POSStats'
import { ShoppingCart, Package, DollarSign } from 'lucide-react'

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

export default function POSPage() {
  const { isAuthorized, isLoading } = useAuth('cashier')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Cart management functions
  const addToCart = (product: {
    id: string
    barcode: string
    name_en: string
    name_mm: string
    base_price: number
    image?: string
    stock?: number
    price?: number
  }) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        )
      }
      
      return [...prev, {
        id: product.id,
        barcode: product.barcode,
        name_en: product.name_en,
        name_mm: product.name_mm,
        price: product.price || product.base_price,
        quantity: 1,
        stock: product.stock || 0,
        image: product.image
      }]
    })
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    )
  }

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxRate = 0.06 // 6% tax
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const processPayment = async () => {
    setIsProcessingPayment(true)
    try {
      // TODO: Implement actual payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing
      clearCart()
    } catch (error) {
      console.error('Payment processing error:', error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <POSHeader />

      {/* Main POS Interface */}
      <div className="p-4 max-w-[1400px] mx-auto flex flex-col h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 mb-6">
          
          {/* Left Side - Product Search & Selection */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col">
                <POSProductSearch onAddToCart={addToCart} />
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Cart & Checkout */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-orange-600" />
                    Shopping Cart
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <POSCart
                  items={cartItems}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                />
                
                {/* Totals */}
                <div className="mt-auto pt-4">
                  <Separator className="mb-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-base">
                      <span>Subtotal:</span>
                      <span>RM {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span>Tax (6%):</span>
                      <span>RM {tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">RM {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    onClick={processPayment}
                    disabled={cartItems.length === 0 || isProcessingPayment}
                    className="w-full mt-4 h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                    size="lg"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5 mr-2" />
                        Process Payment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Stats - Fixed at bottom */}
        <div className="flex-shrink-0">
          <POSStats />
        </div>
      </div>
    </div>
  )
}