import { supabase } from '@/lib/supabase'
import type { Transaction, TransactionItem } from '@/types/database.types'

export interface CreateTransactionData {
  branch_id: string
  cashier_id: string
  customer_name?: string
  customer_phone?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  staff_checkout?: boolean
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export interface TransactionWithItems extends Transaction {
  transaction_items: TransactionItem[]
}

// Generate transaction number in format: TX-YYYYMMDD-XXXX
function generateTransactionNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.getTime().toString().slice(-4)
  return `TX-${date}-${time}`
}

export async function createTransaction(data: CreateTransactionData): Promise<TransactionWithItems> {
  try {
    // Start a transaction
    const transactionNumber = generateTransactionNumber()
    
    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        transaction_number: transactionNumber,
        branch_id: data.branch_id,
        cashier_id: data.cashier_id,
        customer_name: data.customer_name || null,
        customer_phone: data.customer_phone || null,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        discount_amount: data.discount_amount,
        total_amount: data.total_amount,
        payment_method: data.payment_method,
        staff_checkout: data.staff_checkout || false,
        status: 'completed'
      }])
      .select()
      .single()

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }

    // Insert transaction items
    const transactionItems = data.items.map(item => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }))

    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems)
      .select()

    if (itemsError) {
      // Rollback transaction if items insert fails
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
      
      throw new Error(`Failed to create transaction items: ${itemsError.message}`)
    }

    // Update inventory quantities manually (without stored procedure for now)
    for (const item of data.items) {
      const { data: currentInventory, error: fetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .eq('branch_id', data.branch_id)
        .single()

      if (fetchError) {
        console.error(`Failed to fetch inventory for product ${item.product_id}:`, fetchError)
        continue
      }

      const newQuantity = Math.max(0, (currentInventory?.quantity || 0) - item.quantity)
      
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', item.product_id)
        .eq('branch_id', data.branch_id)

      if (updateError) {
        console.error(`Failed to update inventory for product ${item.product_id}:`, updateError)
        // Continue with other items even if one fails
      }
    }

    return {
      ...transaction,
      transaction_items: items
    }
  } catch (error) {
    console.error('Transaction creation failed:', error)
    throw error
  }
}

export async function getTransactionById(id: string): Promise<TransactionWithItems | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        product_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        products (
          name_en,
          name_mm,
          barcode
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching transaction:', error)
    return null
  }

  return data
}

export async function getTransactionsByBranch(
  branchId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  transactions: TransactionWithItems[]
  totalCount: number
  totalPages: number
}> {
  const offset = (page - 1) * limit

  // Get transactions with items
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        product_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        products (
          name_en,
          name_mm,
          barcode
        )
      ),
      users!cashier_id (
        name
      )
    `)
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  // Get total count
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)

  if (countError) {
    throw new Error(`Failed to get transaction count: ${countError.message}`)
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return {
    transactions: transactions || [],
    totalCount,
    totalPages
  }
}

// Get today's sales summary
export async function getTodaysSales(branchId: string): Promise<{
  totalSales: number
  totalTransactions: number
  averageTransaction: number
}> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('transactions')
    .select('total_amount')
    .eq('branch_id', branchId)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)

  if (error) {
    throw new Error(`Failed to fetch today's sales: ${error.message}`)
  }

  const totalSales = data.reduce((sum, transaction) => sum + transaction.total_amount, 0)
  const totalTransactions = data.length
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

  return {
    totalSales,
    totalTransactions,
    averageTransaction
  }
}

// Get all transactions for admin (with filters)
export async function getAllTransactions(
  page = 1,
  limit = 20,
  filters?: {
    branchId?: string
    cashierId?: string
    paymentMethod?: string
    transactionNumber?: string
    startDate?: string
    endDate?: string
    staffCheckout?: boolean
  }
): Promise<{
  transactions: (TransactionWithItems & { 
    users?: { name: string } 
    branches?: { name: string; location: string }
  })[]
  totalCount: number
  totalPages: number
}> {
  const offset = (page - 1) * limit

  let query = supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        id,
        product_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        products (
          name_en,
          name_mm,
          barcode
        )
      ),
      users!cashier_id (
        name
      ),
      branches (
        name,
        location
      )
    `)

  // Apply filters
  if (filters?.branchId && filters.branchId !== 'all') {
    query = query.eq('branch_id', filters.branchId)
  }
  if (filters?.cashierId) {
    query = query.eq('cashier_id', filters.cashierId)
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod)
  }
  if (filters?.transactionNumber) {
    query = query.ilike('transaction_number', `%${filters.transactionNumber}%`)
  }
  if (filters?.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }
  if (filters?.staffCheckout !== undefined) {
    query = query.eq('staff_checkout', filters.staffCheckout)
  }

  const { data: transactions, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  // Get total count with same filters
  let countQuery = supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  // Apply same filters for count
  if (filters?.branchId && filters.branchId !== 'all') {
    countQuery = countQuery.eq('branch_id', filters.branchId)
  }
  if (filters?.cashierId) {
    countQuery = countQuery.eq('cashier_id', filters.cashierId)
  }
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    countQuery = countQuery.eq('payment_method', filters.paymentMethod)
  }
  if (filters?.transactionNumber) {
    countQuery = countQuery.ilike('transaction_number', `%${filters.transactionNumber}%`)
  }
  if (filters?.startDate) {
    countQuery = countQuery.gte('created_at', `${filters.startDate}T00:00:00.000Z`)
  }
  if (filters?.endDate) {
    countQuery = countQuery.lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }
  if (filters?.staffCheckout !== undefined) {
    countQuery = countQuery.eq('staff_checkout', filters.staffCheckout)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    throw new Error(`Failed to get transaction count: ${countError.message}`)
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / limit)

  return {
    transactions: transactions || [],
    totalCount,
    totalPages
  }
}