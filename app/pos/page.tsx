'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { ReceiptPrinterProvider, useReceiptPrinter } from '@/contexts/ReceiptPrinterContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LoadingSpinner from '@/components/ui/loading-spinner'
import POSProductSearch from '@/components/pos/POSProductSearch'
import POSCart from '@/components/pos/POSCart'
import POSHeader from '@/components/pos/POSHeader'
import { SupplierService } from '@/services/supplier-service'
import type { Supplier } from '@/types/database.types'
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
  const { printReceipt, isConnected, connectPrinter, setMethod } = useReceiptPrinter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<'customer' | 'staff' | 'supplier'>('customer')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Pick<Supplier, 'id' | 'name' | 'phone' | 'contact_person'>[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [stockUpdates, setStockUpdates] = useState<Map<string, number>>(new Map())

  // Set QZ Tray method for cashier devices (thermal printers)
  React.useEffect(() => {
    setMethod('qz-tray')
  }, [setMethod])

  // Periodic refresh for data consistency (every 5 minutes)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Fetch suppliers when component mounts
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoadingSuppliers(true)
      try {
        const suppliersData = await SupplierService.getActiveSuppliers()
        setSuppliers(suppliersData)
      } catch (error) {
        console.error('Failed to fetch suppliers:', error)
      } finally {
        setIsLoadingSuppliers(false)
      }
    }

    fetchSuppliers()
  }, [])

  // Handle stock updates for optimistic UI
  const handleStockUpdate = (productId: string, quantityChange: number) => {
    setStockUpdates(prev => {
      const newMap = new Map(prev)
      const currentChange = newMap.get(productId) || 0
      newMap.set(productId, currentChange + quantityChange)
      return newMap
    })
  }

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
          const oldQuantity = item.quantity
          // Don't allow quantity to exceed stock
          const validQuantity = Math.min(newQuantity, item.stock)
          if (newQuantity > item.stock) {
            alert(`Only ${item.stock} items available in stock!`)
          }
          
          // Update stock tracking if quantity changed
          const quantityDiff = validQuantity - oldQuantity
          if (quantityDiff !== 0) {
            handleStockUpdate(itemId, -quantityDiff)
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
    setCartItems(prev => {
      const itemToRemove = prev.find(item => item.id === itemId)
      if (itemToRemove) {
        // Return stock when removing item
        handleStockUpdate(itemId, itemToRemove.quantity)
      }
      return prev.filter(item => item.id !== itemId)
    })
  }

  const clearCart = () => {
    // Return all stock when clearing cart
    cartItems.forEach(item => {
      handleStockUpdate(item.id, item.quantity)
    })
    setCartItems([])
  }

  // Handle checkout mode change
  const handleCheckoutModeChange = (newMode: 'customer' | 'staff' | 'supplier') => {
    setCheckoutMode(newMode)
    // Reset supplier selection when not in supplier mode
    if (newMode !== 'supplier') {
      setSelectedSupplierId('')
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal
  
  // Calculate change
  const paidAmount = Number.parseFloat(amountPaid) || 0
  const change = paidAmount - total
  const isPaymentValid = paidAmount >= total && total > 0 && (checkoutMode !== 'supplier' || selectedSupplierId)


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

    if (!isPaymentValid) {
      alert('Please enter a valid payment amount that covers the total.')
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

      // Validate supplier selection for supplier checkout
      if (checkoutMode === 'supplier' && !selectedSupplierId) {
        alert('Please select a supplier for supplier checkout.')
        return
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
        staff_checkout: checkoutMode === 'staff',
        supplier_checkout: checkoutMode === 'supplier',
        supplier_id: checkoutMode === 'supplier' ? selectedSupplierId : undefined,
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
        isStaffCheckout: checkoutMode === 'staff',
        amountPaid: paidAmount,
        change: change
      }
      
      // Success! Clear cart and show success message
      setCartItems([]) // Clear cart without returning stock (it's been sold)
      setStockUpdates(new Map()) // Clear optimistic stock updates
      setCheckoutMode('customer')
      setAmountPaid('')
      setSelectedSupplierId('')
      // Note: Stock updates are now handled optimistically in real-time
      const checkoutType = checkoutMode === 'staff' ? 'Staff' : checkoutMode === 'supplier' ? 'Supplier' : 'Customer'
      
      // Show success message
      alert(`${checkoutType} payment successful! Transaction #${transaction.transaction_number}`)
      
      // Only print receipt for customer transactions
      if (checkoutMode === 'customer') {
        await printReceipt(receiptData)
      }
      
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
                {branchId && <POSProductSearch branchId={branchId} onAddToCart={addToCart} onStockUpdate={handleStockUpdate} refreshTrigger={refreshTrigger} />}
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

                  {/* Payment Section */}
                  <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Paid
                      </label>
                      <div className="space-y-2">
                        <Input
                          id="amount-paid"
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="text-lg font-bold text-center"
                          disabled={cartItems.length === 0}
                        />
                        {total > 0 && (
                          <Button
                            onClick={() => setAmountPaid(total.toFixed(2))}
                            variant="outline"
                            size="sm"
                            className="w-full cursor-pointer"
                            disabled={cartItems.length === 0}
                          >
                            Exact Amount (RM {total.toFixed(2)})
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {amountPaid && paidAmount > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg">
                          <span>Amount Paid:</span>
                          <span className="font-bold">RM {paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span>Change:</span>
                          <span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            RM {change.toFixed(2)}
                          </span>
                        </div>
                        {change < 0 && (
                          <div className="text-sm text-red-600 text-center">
                            Insufficient payment amount
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Printer Status */}
                  <React.Fragment>
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <PrinterCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <Printer className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm">
                          Thermal Printer: {isConnected ? 'Connected' : 'Not Connected'}
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
                  </React.Fragment>

                  {/* Payment Button */}
                  <Button
                    onClick={processPayment}
                    disabled={cartItems.length === 0 || isProcessingPayment || !isPaymentValid}
                    className="w-full h-14 text-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
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


                  {/* Checkout Mode Selection - Below main button */}
                  <div className="border-t pt-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                        Checkout Mode
                      </Label>
                      <RadioGroup 
                        value={checkoutMode} 
                        onValueChange={handleCheckoutModeChange}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="customer" id="customer" />
                          <Label htmlFor="customer" className="text-sm cursor-pointer">
                            Customer Purchase
                          </Label>
                          {checkoutMode === 'customer' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              CUSTOMER
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="staff" id="staff" />
                          <Label htmlFor="staff" className="text-sm cursor-pointer">
                            Staff Purchase
                          </Label>
                          {checkoutMode === 'staff' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              STAFF
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="supplier" id="supplier" />
                          <Label htmlFor="supplier" className="text-sm cursor-pointer">
                            Supplier Checkout
                          </Label>
                          {checkoutMode === 'supplier' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              SUPPLIER
                            </Badge>
                          )}
                        </div>
                      </RadioGroup>

                      {/* Supplier Selection - Only show when supplier checkout is selected */}
                      {checkoutMode === 'supplier' && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                            Select Supplier *
                          </Label>
                          {isLoadingSuppliers ? (
                            <div className="flex items-center justify-center py-2">
                              <LoadingSpinner size="sm" />
                              <span className="ml-2 text-sm text-gray-500">Loading suppliers...</span>
                            </div>
                          ) : (
                            <Select 
                              value={selectedSupplierId} 
                              onValueChange={setSelectedSupplierId}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.length === 0 ? (
                                  <SelectItem value="" disabled>
                                    No suppliers available
                                  </SelectItem>
                                ) : (
                                  suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{supplier.name}</span>
                                        {supplier.contact_person && (
                                          <span className="text-xs text-gray-500">
                                            Contact: {supplier.contact_person}
                                            {supplier.phone && ` • ${supplier.phone}`}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          {checkoutMode === 'supplier' && !selectedSupplierId && (
                            <p className="text-xs text-red-600 mt-1">
                              Please select a supplier to continue
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-600 mt-2">
                        {checkoutMode === 'customer' && 'Standard customer purchase'}
                        {checkoutMode === 'staff' && 'Staff member purchasing items'}
                        {checkoutMode === 'supplier' && 'Store purchasing from supplier - increases inventory'}
                      </p>
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