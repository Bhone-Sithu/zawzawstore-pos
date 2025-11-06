'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DailySummary } from '@/services/daily-report-service'
import { PDFService } from '@/services/pdf-service'
import { EmailService } from '@/services/email-service'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Mail,
  CheckCircle,
  Printer
} from 'lucide-react'

interface EndOfDayModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmLogout: () => void
  summary: DailySummary | null
  isLoading: boolean
}

export default function EndOfDayModal({ 
  isOpen, 
  onClose, 
  onConfirmLogout, 
  summary, 
  isLoading 
}: EndOfDayModalProps) {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSendReport = async () => {
    if (!summary) return
    
    setIsSendingEmail(true)
    try {
      const success = await EmailService.sendDailyReport(summary)
      if (success) {
        setIsEmailSent(true)
      } else {
        alert('Failed to send email report. Please try again.')
      }
    } catch (error) {
      console.error('Failed to send report:', error)
      alert('Failed to send email report. Please try again.')
    } finally {
      setIsSendingEmail(false)
    }
  }


  const handlePrintToPDF = async () => {
    if (!summary) return
    
    try {
      await PDFService.printToPDF(summary)
    } catch (error) {
      console.error('Failed to print PDF:', error)
      alert('Failed to open print dialog. Please ensure pop-ups are allowed.')
    }
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generating End of Day Report...</DialogTitle>
            <DialogDescription>
              Please wait while we prepare your daily summary.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!summary) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">End of Day Report</DialogTitle>
          <DialogDescription>
            Daily summary for {summary.cashierName} - {summary.branchName} - {summary.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <p className="text-xs text-gray-500">
                  {summary.customerTransactions} customer sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary.totalProfit)}
                </div>
                <p className="text-xs text-gray-500">
                  {summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : '0'}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {summary.totalTransactions}
                </div>
                <p className="text-xs text-gray-500">
                  Avg: {formatCurrency(summary.averageOrderValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  Other
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {summary.staffPurchases > 0 && (
                    <div className="text-sm">
                      <span className="text-blue-600">Staff: {formatCurrency(summary.staffPurchases)}</span>
                    </div>
                  )}
                  {summary.supplierPurchases > 0 && (
                    <div className="text-sm">
                      <span className="text-purple-600">Supplier: {formatCurrency(summary.supplierPurchases)}</span>
                    </div>
                  )}
                  {summary.staffPurchases === 0 && summary.supplierPurchases === 0 && (
                    <div className="text-sm text-gray-500">None</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today&apos;s Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions recorded today.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Transaction ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Time</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Items</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Payment</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.transactions.map((txn, index) => (
                          <tr key={txn.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm font-medium">{txn.transaction_number}</span>
                            </td>
                            <td className="py-3 px-4">
                              {txn.supplier_checkout ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Supplier
                                </Badge>
                              ) : txn.staff_checkout ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Staff
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Customer
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatTime(txn.created_at)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {txn.items.length} items
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                              {txn.payment_method}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-semibold text-lg">{formatCurrency(txn.total_amount)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={handlePrintToPDF}
                variant="outline"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print to PDF
              </Button>
              
              
              <Button
                onClick={handleSendReport}
                disabled={isSendingEmail || isEmailSent}
                variant="outline"
                className={`flex items-center gap-2 ${isEmailSent ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
              >
                {isEmailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Report Sent
                  </>
                ) : isSendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Email Report
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={onConfirmLogout}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirm Logout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}