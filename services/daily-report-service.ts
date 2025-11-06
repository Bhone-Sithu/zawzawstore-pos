import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay } from 'date-fns'

export interface DailySummary {
  date: string
  totalRevenue: number
  totalTransactions: number
  customerTransactions: number
  staffPurchases: number
  supplierPurchases: number
  totalProfit: number
  averageOrderValue: number
  transactions: DailyTransaction[]
  cashierName: string
  branchName: string
}

export interface DailyTransaction {
  id: string
  transaction_number: string
  created_at: string
  total_amount: number
  payment_method: string
  staff_checkout: boolean
  supplier_checkout: boolean
  items: DailyTransactionItem[]
}

export interface DailyTransactionItem {
  product_name_en: string
  product_name_mm: string
  barcode: string
  quantity: number
  unit_price: number
  total_price: number
}

export class DailyReportService {
  static async getDailySummary(
    branchId: string, 
    cashierId: string, 
    date: Date = new Date()
  ): Promise<DailySummary> {
    const startDate = startOfDay(date).toISOString()
    const endDate = endOfDay(date).toISOString()

    // Fetch all transactions for the day by this cashier
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        branches(name),
        users(name),
        suppliers(
          id,
          name,
          contact_person,
          phone
        ),
        transaction_items(
          *,
          products(
            name_en,
            name_mm,
            barcode,
            supplier_price
          )
        )
      `)
      .eq('branch_id', branchId)
      .eq('cashier_id', cashierId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch daily transactions: ${error.message}`)
    }

    if (!transactions || transactions.length === 0) {
      // Return empty summary if no transactions
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', cashierId)
        .single()

      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single()

      return {
        date: date.toLocaleDateString(),
        totalRevenue: 0,
        totalTransactions: 0,
        customerTransactions: 0,
        staffPurchases: 0,
        supplierPurchases: 0,
        totalProfit: 0,
        averageOrderValue: 0,
        transactions: [],
        cashierName: userData?.name || 'Unknown',
        branchName: branchData?.name || 'Unknown'
      }
    }

    // Separate transactions by type
    const customerTxns = transactions.filter(t => !t.staff_checkout && !t.supplier_checkout)
    const staffTxns = transactions.filter(t => t.staff_checkout && !t.supplier_checkout)
    const supplierTxns = transactions.filter(t => t.supplier_checkout)

    // Calculate metrics
    const totalRevenue = customerTxns.reduce((sum, txn) => sum + Number(txn.total_amount), 0)
    const totalTransactions = transactions.length
    const customerTransactions = customerTxns.length
    const staffPurchases = staffTxns.reduce((sum, txn) => sum + Number(txn.total_amount), 0)
    const supplierPurchases = supplierTxns.reduce((sum, txn) => sum + Number(txn.total_amount), 0)

    // Calculate profit (only from customer transactions)
    const totalProfit = customerTxns.reduce((sum, txn) => {
      const txnProfit = txn.transaction_items?.reduce((itemSum: number, item: any) => {
        const supplierPrice = Number(item.products?.supplier_price || 0)
        const sellingPrice = Number(item.unit_price)
        const quantity = Number(item.quantity)
        return itemSum + ((sellingPrice - supplierPrice) * quantity)
      }, 0) || 0
      return sum + txnProfit
    }, 0)

    const averageOrderValue = customerTransactions > 0 ? totalRevenue / customerTransactions : 0

    // Transform transactions for the report
    const formattedTransactions: DailyTransaction[] = transactions.map(txn => ({
      id: txn.id,
      transaction_number: txn.transaction_number,
      created_at: txn.created_at,
      total_amount: Number(txn.total_amount),
      payment_method: txn.payment_method,
      staff_checkout: txn.staff_checkout,
      supplier_checkout: txn.supplier_checkout || false,
      items: txn.transaction_items?.map((item: any) => ({
        product_name_en: item.products?.name_en || 'Unknown',
        product_name_mm: item.products?.name_mm || 'Unknown',
        barcode: item.products?.barcode || '',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price)
      })) || []
    }))

    return {
      date: date.toLocaleDateString(),
      totalRevenue,
      totalTransactions,
      customerTransactions,
      staffPurchases,
      supplierPurchases,
      totalProfit,
      averageOrderValue,
      transactions: formattedTransactions,
      cashierName: (transactions[0] as any).users?.name || 'Unknown',
      branchName: (transactions[0] as any).branches?.name || 'Unknown'
    }
  }

  static async sendDailyReport(
    summary: DailySummary,
    emailAddresses: string[]
  ): Promise<void> {
    // This would integrate with your email service (e.g., Resend, SendGrid, etc.)
    // For now, we'll prepare the data structure
    
    const emailData = {
      to: emailAddresses,
      subject: `Daily Sales Report - ${summary.branchName} - ${summary.date}`,
      cashierName: summary.cashierName,
      branchName: summary.branchName,
      summary,
      attachments: [
        {
          filename: `daily-report-${summary.date.replace(/\//g, '-')}.pdf`,
          content: 'PDF_CONTENT_PLACEHOLDER' // Will be generated by PDF service
        }
      ]
    }

    // TODO: Integrate with actual email service
    console.log('Email data prepared:', emailData)
    
    // For now, just log the report
    console.log('Daily Report Summary:', summary)
  }
}