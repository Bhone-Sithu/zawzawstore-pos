'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ReceiptPrinterProvider, useReceiptPrinter } from '@/contexts/ReceiptPrinterContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LoadingSpinner from '@/components/ui/loading-spinner'
import POSProductSearch from '@/components/pos/POSProductSearch'
import POSCart from '@/components/pos/POSCart'
import POSHeader from '@/components/pos/POSHeader'
import POSStats from '@/components/pos/POSStats'
import { createTransaction } from '@/services/transaction-service'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, DollarSign, Printer, PrinterCheck } from 'lucide-react'

interface CartItem {
  id: string
  barcode: string
  name_en: string
  name_mm: string
  price: number
  quantity: number
  stock: number
  image?: string
  customPrice?: boolean
}


function POSPageContent() {
  const { isAuthorized, isLoading, branchId, user } = useAuth('cashier')
  const { printReceipt, isSupported, isConnected, connectPrinter } = useReceiptPrinter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isStaffCheckout, setIsStaffCheckout] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
    category?: { custom_price: boolean }
  }) => {
    // Don't add if no stock
    if (!product.stock || product.stock <= 0) {
      alert('This item is out of stock!')
      return
    }

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id)
      
      if (existingItem) {
        // Check if we can add more (don't exceed available stock)
        if (existingItem.quantity >= existingItem.stock) {
          alert(`Only ${existingItem.stock} items available in stock!`)
          return prev
        }
        
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
        image: product.image,
        customPrice: product.category?.custom_price || false
      }]
    })
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          // Don't allow quantity to exceed stock
          const validQuantity = Math.min(newQuantity, item.stock)
          if (newQuantity > item.stock) {
            alert(`Only ${item.stock} items available in stock!`)
          }
          return { ...item, quantity: validQuantity }
        }
        return item
      })
    )
  }

  const updatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return

    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId && item.customPrice) {
          return { ...item, price: newPrice }
        }
        return item
      })
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
  const total = subtotal


  // Get branch name helper
  const getBranchName = async (branchId: string) => {
    const { data } = await supabase
      .from('branches')
      .select('name')
      .eq('id', branchId)
      .single()
    return data?.name || 'Unknown Branch'
  }

  const processPayment = async () => {
    if (!branchId || !user || cartItems.length === 0) {
      alert('Unable to process payment. Please try again.')
      return
    }

    setIsProcessingPayment(true)
    try {
      // Get cashier ID from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Unable to find cashier information')
      }

      // Prepare transaction data
      const transactionData = {
        branch_id: branchId,
        cashier_id: userData.id,
        subtotal,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: total,
        payment_method: 'cash', // Default to cash for now
        staff_checkout: isStaffCheckout,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      }

      // Create transaction
      const transaction = await createTransaction(transactionData)
      
      // Get branch name for receipt
      const branchName = await getBranchName(branchId)
      
      // Prepare receipt data
      const receiptData = {
        transactionNumber: transaction.transaction_number,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        branchName,
        cashierName: user.firstName || 'Cashier',
        items: cartItems.map(item => ({
          name_en: item.name_en,
          name_mm: item.name_mm,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        tax: 0,
        total,
        paymentMethod: 'cash',
        isStaffCheckout
      }
      
      // Success! Clear cart and show success message
      clearCart()
      setIsStaffCheckout(false)
      // Refresh product list to update stock quantities
      setRefreshTrigger(prev => prev + 1)
      const checkoutType = isStaffCheckout ? 'Staff' : 'Customer'
      
      // Show success message
      alert(`${checkoutType} payment successful! Transaction #${transaction.transaction_number}`)
      
      // Automatically print receipt with current transaction data
      await printReceipt(receiptData)
      
    } catch (error) {
      console.error('Payment processing error:', error)
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
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
                {branchId && <POSProductSearch branchId={branchId} onAddToCart={addToCart} refreshTrigger={refreshTrigger} />}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Cart & Checkout */}
          <div className="flex flex-col">
            <Card className="flex flex-col">
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
              <CardContent className="flex flex-col">
                {/* Cart Items - Limited height with scroll */}
                <div className="mb-4">
                  <POSCart
                    items={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onUpdatePrice={updatePrice}
                    onRemoveItem={removeFromCart}
                    onClearCart={clearCart}
                  />
                </div>
                
                {/* Totals & Checkout - At bottom of cart */}
                <div className="pt-4 border-t">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">RM {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Printer Status */}
                  {isSupported && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <PrinterCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Printer className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          Receipt Printer: {isConnected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                      {!isConnected && (
                        <Button
                          onClick={connectPrinter}
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs cursor-pointer"
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Payment Button */}
                  <Button
                    onClick={processPayment}
                    disabled={cartItems.length === 0 || isProcessingPayment}
                    className="w-full h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer mb-4"
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


                  {/* Staff Checkout Toggle - Below main button */}
                  <div className="border-t pt-4">
                    <div 
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" 
                      onClick={() => setIsStaffCheckout(!isStaffCheckout)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setIsStaffCheckout(!isStaffCheckout)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Toggle staff checkout mode"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="staff-checkout"
                          checked={isStaffCheckout}
                          onCheckedChange={(checked: boolean) => setIsStaffCheckout(checked)}
                          className="h-5 w-5 cursor-pointer border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <div>
                          <label 
                            htmlFor="staff-checkout" 
                            className="text-sm font-semibold text-blue-800 cursor-pointer"
                          >
                            Staff Checkout Mode
                          </label>
                          <p className="text-xs text-blue-600">
                            {isStaffCheckout ? 'Processing as staff purchase' : 'Click to enable staff checkout'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={isStaffCheckout ? "default" : "outline"} 
                        className={`text-sm px-3 py-1 font-medium ${
                          isStaffCheckout 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-blue-600 border-blue-300'
                        }`}
                      >
                        {isStaffCheckout ? 'STAFF' : 'CUSTOMER'}
                      </Badge>
                    </div>
                  </div>
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

export default function POSPage() {
  return (
    <ReceiptPrinterProvider>
      <POSPageContent />
    </ReceiptPrinterProvider>
  )
}