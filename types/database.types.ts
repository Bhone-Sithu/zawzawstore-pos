export type UserRole = 'admin' | 'cashier' | 'boss'
export type TransactionStatus = 'pending' | 'completed' | 'cancelled'
export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled'

export interface Branch {
  id: string
  name: string
  location: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  clerk_id: string
  email: string
  name: string
  role: UserRole
  branch_id?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name_en: string
  name_mm: string
  description?: string
  custom_price: boolean
  created_at: string
}

export interface Product {
  id: string
  barcode: string
  name_en: string
  name_mm: string
  image: string
  category_id?: string
  supplier_price?: number
  base_price: number
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  categories?: {
    name_en: string
    name_mm: string
  }
}

export interface Inventory {
  id: string
  product_id: string
  branch_id: string
  quantity: number
  price?: number
  expiry_date?: string
  updated_at: string
}

export interface Transaction {
  id: string
  transaction_number: string
  branch_id: string
  cashier_id: string
  customer_name?: string
  customer_phone?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string
  status: TransactionStatus
  staff_checkout: boolean
  created_at: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface StockTransfer {
  id: string
  from_branch_id: string
  to_branch_id: string
  requested_by: string
  approved_by?: string
  status: TransferStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface StockTransferItem {
  id: string
  transfer_id: string
  product_id: string
  quantity: number
  received_quantity: number
  created_at: string
}

export interface StaffItem {
  id: string
  staff_id: string
  product_id: string
  quantity: number
  month: number
  year: number
  notes?: string
  created_at: string
  updated_at: string
}