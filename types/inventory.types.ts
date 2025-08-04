import type { Product, Branch, Category } from './database.types'

export interface InventoryItem {
  id: string
  product_id: string
  branch_id: string
  quantity: number
  price?: number
  expiry_date?: string
  updated_at: string
  product: {
    id: string
    barcode: string
    name_en: string
    name_mm: string
    image?: string
    base_price: number
    category?: {
      id: string
      name_en: string
      name_mm: string
    }
  }
  branch: {
    id: string
    name: string
    location: string
  }
}

export interface InventoryStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  byBranch: {
    [branchId: string]: {
      name: string
      location: string
      totalProducts: number
      totalValue: number
      lowStockItems: number
      outOfStockItems: number
    }
  }
}

export interface InventoryHookResult {
  inventory: InventoryItem[]
  stats: InventoryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateQuantity: (inventoryId: string, newQuantity: number, notes?: string) => Promise<{ success: boolean; error?: string }>
  createRecord: (productId: string, branchId: string, quantity: number, price?: number, expiryDate?: string) => Promise<{ success: boolean; error?: string }>
}

export interface StockMovement {
  id: string
  product_id: string
  branch_id: string
  movement_type: 'received' | 'sold' | 'adjustment' | 'damaged' | 'expired' | 'theft'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reference_id?: string
  notes?: string
  user_id: string
  created_at: string
}

export interface StockAdjustment {
  productId: string
  branchId: string
  quantityChange: number
  movementType: StockMovement['movement_type']
  notes?: string
  userId: string
}