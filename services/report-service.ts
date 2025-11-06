import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, format } from 'date-fns'

export interface SalesMetrics {
  totalRevenue: number
  totalProfit: number
  totalTransactions: number
  averageOrderValue: number
  profitMargin: number
  staffPurchases: number
  supplierPurchases: number
  customerTransactions: number
}

export interface BranchSales {
  name: string
  location: string
  revenue: number
  transactions: number
  profit: number
}

export interface CategorySales {
  name: string
  revenue: number
  quantity: number
  profit: number
}

export interface PaymentMethodData {
  method: string
  revenue: number
  transactions: number
}

export interface DailySales {
  date: string
  revenue: number
  transactions: number
  profit: number
}

export interface StaffPerformance {
  name: string
  role: string
  totalSales: number
  totalTransactions: number
  customerSales: number
  staffCheckouts: number
  supplierCheckouts: number
}

export interface SalesDashboardData {
  metrics: SalesMetrics
  branchSales: BranchSales[]
  categorySales: CategorySales[]
  paymentMethods: PaymentMethodData[]
  dailySales: DailySales[]
  staffPerformance: StaffPerformance[]
  period: string
  dateRange: {
    start: string
    end: string
  }
}

export type SalesPeriod = 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_7_days' | 'last_30_days' | 'custom'

export class ReportService {
  static getDateRange(period: SalesPeriod, customStart?: string, customEnd?: string) {
    const now = new Date()
    
    if (period === 'custom' && customStart && customEnd) {
      return {
        gte: customStart,
        lte: customEnd
      }
    }

    switch (period) {
      case 'today':
        return {
          gte: startOfDay(now).toISOString(),
          lte: endOfDay(now).toISOString()
        }
      case 'yesterday':
        const yesterday = subDays(now, 1)
        return {
          gte: startOfDay(yesterday).toISOString(),
          lte: endOfDay(yesterday).toISOString()
        }
      case 'week':
        return {
          gte: startOfWeek(now).toISOString(),
          lte: endOfWeek(now).toISOString()
        }
      case 'last_week':
        const lastWeek = subWeeks(now, 1)
        return {
          gte: startOfWeek(lastWeek).toISOString(),
          lte: endOfWeek(lastWeek).toISOString()
        }
      case 'month':
        return {
          gte: startOfMonth(now).toISOString(),
          lte: endOfMonth(now).toISOString()
        }
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        return {
          gte: startOfMonth(lastMonth).toISOString(),
          lte: endOfMonth(lastMonth).toISOString()
        }
      case 'year':
        return {
          gte: startOfYear(now).toISOString(),
          lte: endOfYear(now).toISOString()
        }
      case 'last_7_days':
        return {
          gte: subDays(now, 7).toISOString(),
          lte: now.toISOString()
        }
      case 'last_30_days':
        return {
          gte: subDays(now, 30).toISOString(),
          lte: now.toISOString()
        }
      default:
        return {
          gte: startOfDay(now).toISOString(),
          lte: endOfDay(now).toISOString()
        }
    }
  }

  static async getSalesData(
    period: SalesPeriod = 'today',
    branchId?: string,
    customStart?: string,
    customEnd?: string
  ): Promise<SalesDashboardData> {
    try {
      const dateFilter = this.getDateRange(period, customStart, customEnd)

      // Build query
      let query = supabase
        .from('transactions')
        .select(`
          *,
          branches(name, location),
          users(name, role),
          transaction_items(
            *,
            products(
              name_en,
              name_mm,
              base_price,
              supplier_price,
              categories(name_en, name_mm)
            )
          )
        `)
        .eq('status', 'completed')
        .gte('created_at', dateFilter.gte)
        .lte('created_at', dateFilter.lte)

      // Add branch filter if specified
      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId)
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        throw new Error('Failed to fetch sales data')
      }

      // Calculate metrics - only include customer transactions in revenue
      const customerTransactions = transactions?.filter(t => !t.staff_checkout && !(t as any).supplier_checkout) || []
      const staffTransactions = transactions?.filter(t => t.staff_checkout && !(t as any).supplier_checkout) || []
      const supplierTransactions = transactions?.filter(t => (t as any).supplier_checkout) || []
      
      const totalRevenue = customerTransactions.reduce((sum, transaction) => sum + Number(transaction.total_amount), 0)
      const totalTransactions = transactions?.length || 0
      const customerTransactionCount = customerTransactions.length
      const staffPurchases = staffTransactions.reduce((sum, transaction) => sum + Number(transaction.total_amount), 0)
      const supplierPurchases = supplierTransactions.reduce((sum, transaction) => sum + Number(transaction.total_amount), 0)
      
      // Calculate profit - only from customer transactions (revenue minus supplier costs)
      const totalProfit = customerTransactions.reduce((sum, transaction) => {
        const transactionProfit = transaction.transaction_items?.reduce((itemSum: number, item: any) => {
          const supplierPrice = Number(item.products?.supplier_price || 0)
          const sellingPrice = Number(item.unit_price)
          const quantity = Number(item.quantity)
          return itemSum + ((sellingPrice - supplierPrice) * quantity)
        }, 0) || 0
        return sum + transactionProfit
      }, 0)

      const averageOrderValue = customerTransactionCount > 0 ? totalRevenue / customerTransactionCount : 0

      // Group by branch for comparison - only customer transactions
      const branchSales = customerTransactions.reduce((acc: any, transaction: any) => {
        const branchName = transaction.branches?.name || 'Unknown'
        if (!acc[branchName]) {
          acc[branchName] = {
            name: branchName,
            location: transaction.branches?.location || '',
            revenue: 0,
            transactions: 0,
            profit: 0
          }
        }
        acc[branchName].revenue += Number(transaction.total_amount)
        acc[branchName].transactions += 1
        
        // Calculate branch profit
        const transactionProfit = transaction.transaction_items?.reduce((itemSum: number, item: any) => {
          const supplierPrice = Number(item.products?.supplier_price || 0)
          const sellingPrice = Number(item.unit_price)
          const quantity = Number(item.quantity)
          return itemSum + ((sellingPrice - supplierPrice) * quantity)
        }, 0) || 0
        acc[branchName].profit += transactionProfit
        
        return acc
      }, {}) || {}

      // Group by category
      const categorySales = transactions?.reduce((acc: any, transaction: any) => {
        transaction.transaction_items?.forEach((item: any) => {
          const categoryName = item.products?.categories?.name_en || 'Uncategorized'
          if (!acc[categoryName]) {
            acc[categoryName] = {
              name: categoryName,
              revenue: 0,
              quantity: 0,
              profit: 0
            }
          }
          acc[categoryName].revenue += Number(item.total_price)
          acc[categoryName].quantity += Number(item.quantity)
          
          const supplierPrice = Number(item.products?.supplier_price || 0)
          const sellingPrice = Number(item.unit_price)
          const quantity = Number(item.quantity)
          acc[categoryName].profit += ((sellingPrice - supplierPrice) * quantity)
        })
        return acc
      }, {}) || {}

      // Payment method breakdown
      const paymentMethods = transactions?.reduce((acc: any, transaction: any) => {
        const method = transaction.payment_method || 'Unknown'
        if (!acc[method]) {
          acc[method] = {
            method,
            revenue: 0,
            transactions: 0
          }
        }
        acc[method].revenue += Number(transaction.total_amount)
        acc[method].transactions += 1
        return acc
      }, {}) || {}

      // Daily sales trend (for charts)
      const dailySales = transactions?.reduce((acc: any, transaction: any) => {
        const date = format(new Date(transaction.created_at), 'yyyy-MM-dd')
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            transactions: 0,
            profit: 0
          }
        }
        acc[date].revenue += Number(transaction.total_amount)
        acc[date].transactions += 1
        
        const transactionProfit = transaction.transaction_items?.reduce((itemSum: number, item: any) => {
          const supplierPrice = Number(item.products?.supplier_price || 0)
          const sellingPrice = Number(item.unit_price)
          const quantity = Number(item.quantity)
          return itemSum + ((sellingPrice - supplierPrice) * quantity)
        }, 0) || 0
        acc[date].profit += transactionProfit
        
        return acc
      }, {}) || {}

      // Staff performance
      const staffPerformance = transactions?.reduce((acc: any, transaction: any) => {
        const staffName = transaction.users?.name || 'Unknown'
        const isStaffCheckout = transaction.staff_checkout
        const isSupplierCheckout = (transaction as any).supplier_checkout
        
        if (!acc[staffName]) {
          acc[staffName] = {
            name: staffName,
            role: transaction.users?.role || 'unknown',
            totalSales: 0,
            totalTransactions: 0,
            customerSales: 0,
            staffCheckouts: 0,
            supplierCheckouts: 0
          }
        }
        
        if (isSupplierCheckout) {
          acc[staffName].supplierCheckouts += Number(transaction.total_amount)
        } else if (isStaffCheckout) {
          acc[staffName].staffCheckouts += Number(transaction.total_amount)
        } else {
          acc[staffName].customerSales += Number(transaction.total_amount)
        }
        
        acc[staffName].totalSales += Number(transaction.total_amount)
        acc[staffName].totalTransactions += 1
        
        return acc
      }, {}) || {}

      return {
        metrics: {
          totalRevenue,
          totalProfit,
          totalTransactions,
          averageOrderValue,
          profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          staffPurchases,
          supplierPurchases,
          customerTransactions: customerTransactionCount
        },
        branchSales: Object.values(branchSales),
        categorySales: Object.values(categorySales),
        paymentMethods: Object.values(paymentMethods),
        dailySales: (Object.values(dailySales) as DailySales[]).sort((a, b) => a.date.localeCompare(b.date)),
        staffPerformance: Object.values(staffPerformance),
        period,
        dateRange: {
          start: dateFilter.gte,
          end: dateFilter.lte
        }
      }

    } catch (error) {
      console.error('Error in sales service:', error)
      throw error
    }
  }

  static async getBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching branches:', error)
        throw new Error('Failed to fetch branches')
      }

      return data || []
    } catch (error) {
      console.error('Error in getBranches:', error)
      throw error
    }
  }
}