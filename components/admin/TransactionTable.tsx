'use client'

import { useState, useEffect } from 'react'
import { getAllTransactions } from '@/services/transaction-service'
import type { TransactionWithItems } from '@/services/transaction-service'
import type { TransactionItem } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Pagination from '@/components/ui/pagination'
import { Loader2, Search, Filter, Eye, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TransactionTableProps {
  branches: Array<{ id: string; name: string; location: string }>
}

type TransactionItemWithProduct = TransactionItem & {
  products?: {
    name_en: string
    name_mm: string
    barcode: string
  }
}

type TransactionWithDetails = TransactionWithItems & { 
  users?: { name: string } 
  branches?: { name: string; location: string }
  transaction_items: TransactionItemWithProduct[]
}

export default function TransactionTable({ branches }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    branchId: 'all',
    paymentMethod: 'all',
    transactionNumber: '',
    startDate: '',
    endDate: '',
    staffCheckout: undefined as boolean | undefined,
    supplierCheckout: undefined as boolean | undefined
  })

  const [appliedFilters, setAppliedFilters] = useState(filters)

  const fetchTransactions = async (page = 1) => {
    setLoading(true)
    try {
      const result = await getAllTransactions(page, 20, {
        ...appliedFilters,
        staffCheckout: appliedFilters.staffCheckout,
        supplierCheckout: appliedFilters.supplierCheckout
      })
      setTransactions(result.transactions)
      setTotalPages(result.totalPages)
      setTotalCount(result.totalCount)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(1)
  }, [appliedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page: number) => {
    fetchTransactions(page)
  }

  const handleSearch = () => {
    setAppliedFilters({ ...filters })
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      branchId: 'all',
      paymentMethod: 'all',
      transactionNumber: '',
      startDate: '',
      endDate: '',
      staffCheckout: undefined,
      supplierCheckout: undefined
    }
    setFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const exportToCSV = () => {
    const headers = [
      'Transaction Number',
      'Date & Time',
      'Branch',
      'Cashier',
      'Items Count',
      'Payment Method',
      'Subtotal',
      'Tax Amount',
      'Discount Amount',
      'Total Amount',
      'Type',
      'Item Details'
    ]

    const csvData = transactions.map(transaction => {
      const itemDetails = transaction.transaction_items?.map((item: TransactionItemWithProduct) => 
        `${item.products?.name_en || 'Unknown'} (${item.quantity}x ${formatCurrency(item.unit_price)})`
      ).join('; ') || 'No items'

      return [
        transaction.transaction_number,
        formatDate(transaction.created_at),
        transaction.branches?.name || 'Unknown',
        transaction.users?.name || 'Unknown',
        transaction.transaction_items?.length || 0,
        transaction.payment_method,
        transaction.subtotal.toFixed(2),
        transaction.tax_amount.toFixed(2),
        transaction.discount_amount.toFixed(2),
        transaction.total_amount.toFixed(2),
        (transaction as TransactionWithItems & { supplier_checkout?: boolean }).supplier_checkout ? 'Supplier' : transaction.staff_checkout ? 'Staff' : 'Customer',
        itemDetails
      ]
    })

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const showingFrom = (currentPage - 1) * 20 + 1
  const showingTo = Math.min(currentPage * 20, totalCount)

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
              <p className="text-sm text-gray-600">
                {totalCount} total transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="cursor-pointer"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Section */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="branch-filter">Branch</Label>
                  <Select value={filters.branchId} onValueChange={(value) => setFilters({...filters, branchId: value})}>
                    <SelectTrigger id="branch-filter" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-60 overflow-auto">
                      <SelectItem value="all" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id} className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment-filter">Payment Method</Label>
                  <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({...filters, paymentMethod: value})}>
                    <SelectTrigger id="payment-filter" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-60 overflow-auto">
                      <SelectItem value="all" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">All Methods</SelectItem>
                      <SelectItem value="cash" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Cash</SelectItem>
                      <SelectItem value="card" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Card</SelectItem>
                      <SelectItem value="digital" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction-search">Transaction Number</Label>
                  <Input
                    id="transaction-search"
                    placeholder="Search by transaction number..."
                    value={filters.transactionNumber}
                    onChange={(e) => setFilters({...filters, transactionNumber: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="purchase-type-filter">Purchase Type</Label>
                  <Select 
                    value={
                      filters.staffCheckout === undefined && filters.supplierCheckout === undefined ? 'all' :
                      filters.staffCheckout ? 'staff' :
                      filters.supplierCheckout ? 'supplier' : 'customer'
                    } 
                    onValueChange={(value) => setFilters({
                      ...filters, 
                      staffCheckout: value === 'staff' ? true : undefined,
                      supplierCheckout: value === 'supplier' ? true : undefined
                    })}
                  >
                    <SelectTrigger id="purchase-type-filter" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-60 overflow-auto">
                      <SelectItem value="all" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">All Types</SelectItem>
                      <SelectItem value="customer" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Customer</SelectItem>
                      <SelectItem value="staff" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Staff Purchase</SelectItem>
                      <SelectItem value="supplier" className="px-3 py-2 hover:bg-orange-50 focus:bg-orange-100 cursor-pointer">Supplier Checkout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters} className="border-gray-300 cursor-pointer">
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Transaction #</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Date & Time</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Branch</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Cashier</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Items</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Payment</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Total</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 cursor-pointer">Type</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 px-4 text-right cursor-pointer">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <TableCell className="py-4 px-4">
                      <p className="font-mono text-sm text-gray-900">{transaction.transaction_number}</p>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.branches?.name}</p>
                        <p className="text-sm text-gray-600">{transaction.branches?.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <p className="text-sm text-gray-900">{transaction.users?.name || 'Unknown'}</p>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <p className="text-sm text-gray-900">{transaction.transaction_items?.length || 0} items</p>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                        {transaction.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <p className="font-semibold text-gray-900">{formatCurrency(transaction.total_amount)}</p>
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      {(transaction as TransactionWithItems & { supplier_checkout?: boolean }).supplier_checkout ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Supplier
                        </Badge>
                      ) : transaction.staff_checkout ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Staff
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Customer
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="h-8 px-3 bg-blue-50 cursor-pointer border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {transactions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 bg-white">
                <p>No transactions found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalItems={totalCount}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl rounded-lg" style={{ width: '50vw', maxWidth: '95vw' }}>
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">Transaction Details</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Transaction #{selectedTransaction.transaction_number}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                    Transaction Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Date:</span>
                      <span className="text-gray-900">{formatDate(selectedTransaction.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Branch:</span>
                      <span className="text-gray-900">{selectedTransaction.branches?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Cashier:</span>
                      <span className="text-gray-900">{selectedTransaction.users?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Payment:</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                        {selectedTransaction.payment_method}
                      </Badge>
                    </div>
                    {(selectedTransaction as TransactionWithItems & { supplier_checkout?: boolean }).supplier_checkout && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Type:</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Supplier Checkout
                        </Badge>
                      </div>
                    )}
                    {selectedTransaction.staff_checkout && !(selectedTransaction as TransactionWithItems & { supplier_checkout?: boolean }).supplier_checkout && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Type:</span>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Staff Purchase
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                    Amount Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">{formatCurrency(selectedTransaction.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Tax:</span>
                      <span className="text-gray-900">{formatCurrency(selectedTransaction.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Discount:</span>
                      <span className="text-gray-900">{formatCurrency(selectedTransaction.discount_amount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-orange-300">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-orange-600">{formatCurrency(selectedTransaction.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  Items Purchased
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <Table className="w-full table-auto">
                      <TableHeader>
                        <TableRow className="border-b border-gray-200 bg-gray-50">
                          <TableHead className="font-semibold text-gray-900 py-3 px-3 min-w-[200px]">Product</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-3 min-w-[120px]">Barcode</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-3 text-center w-16">Qty</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-3 text-right w-24">Unit Price</TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-3 text-right w-24">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTransaction.transaction_items?.map((item: TransactionItemWithProduct, index) => (
                          <TableRow key={item.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                            <TableCell className="py-3 px-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm break-words">{item.products?.name_en}</p>
                                <p className="text-xs text-gray-600 break-words">{item.products?.name_mm}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <p className="font-mono text-xs text-gray-700 break-all">{item.products?.barcode}</p>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-center">
                              <span className="bg-gray-100 text-gray-800 px-1 py-1 rounded text-xs font-medium">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right">
                              <p className="text-gray-900 text-sm">{formatCurrency(item.unit_price)}</p>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right">
                              <p className="font-semibold text-gray-900 text-sm">{formatCurrency(item.total_price)}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}