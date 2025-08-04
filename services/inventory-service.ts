import { supabase } from '@/lib/supabase'
import type { InventoryItem, InventoryStats } from '@/types/inventory.types'

/**
 * Fetch inventory data with optional branch filtering
 */
export async function fetchInventory(branchId?: string): Promise<{ data: InventoryItem[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        product:products(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          is_active,
          category:categories(
            id,
            name_en,
            name_mm
          )
        ),
        branch:branches(
          id,
          name,
          location
        )
      `)
      .order('updated_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query

    if (error) throw error

    // Filter out inventory items with inactive or missing products
    const filteredData = (data || []).filter(item => 
      item.product && item.product.is_active === true
    )

    return { data: filteredData as InventoryItem[], error: null }
  } catch (err) {
    console.error('Error fetching inventory:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Failed to fetch inventory' 
    }
  }
}

/**
 * Calculate inventory statistics
 */
export function calculateStats(inventory: InventoryItem[]): InventoryStats {
  const stats: InventoryStats = {
    totalProducts: inventory.length,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    byBranch: {}
  }

  inventory.forEach(item => {
    const value = item.quantity * (item.price || item.product.base_price)
    stats.totalValue += value

    // Low stock threshold (default 3)
    if (item.quantity <= 3) {
      stats.lowStockItems++
    }
    if (item.quantity === 0) {
      stats.outOfStockItems++
    }

    // By branch stats
    if (!stats.byBranch[item.branch_id]) {
      stats.byBranch[item.branch_id] = {
        name: item.branch.name,
        location: item.branch.location,
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      }
    }

    const branchStats = stats.byBranch[item.branch_id]
    branchStats.totalProducts++
    branchStats.totalValue += value
    if (item.quantity <= 3) branchStats.lowStockItems++
    if (item.quantity === 0) branchStats.outOfStockItems++
  })

  return stats
}

/**
 * Update inventory quantity
 */
export async function updateInventoryQuantity(
  inventoryId: string, 
  newQuantity: number, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryId)

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('Error updating inventory:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to update inventory' 
    }
  }
}

/**
 * Create new inventory record
 */
export async function createInventoryRecord(
  productId: string, 
  branchId: string, 
  quantity: number, 
  price?: number, 
  expiryDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('inventory')
      .insert({
        product_id: productId,
        branch_id: branchId,
        quantity,
        price,
        expiry_date: expiryDate
      })

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('Error creating inventory record:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to create inventory record' 
    }
  }
}

/**
 * Update inventory record with quantity, price, and expiry date
 */
export async function updateInventoryRecord(
  inventoryId: string,
  quantity: number,
  price?: number,
  expiryDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      quantity,
      updated_at: new Date().toISOString()
    }

    if (price !== undefined) {
      updateData.price = price
    }

    if (expiryDate !== undefined) {
      updateData.expiry_date = expiryDate
    }

    const { error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', inventoryId)

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error('Error updating inventory record:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to update inventory record' 
    }
  }
}

/**
 * Get low stock items across all branches
 */
export async function getLowStockItems(threshold: number = 3): Promise<{ data: InventoryItem[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          is_active,
          created_at,
          updated_at
        ),
        branch:branches(
          id,
          name,
          location
        )
      `)
      .eq('product.is_active', true)
      .lte('quantity', threshold)
      .order('quantity', { ascending: true })

    if (error) throw error

    return { data: data as InventoryItem[], error: null }
  } catch (err) {
    console.error('Error fetching low stock items:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Failed to fetch low stock items' 
    }
  }
}

/**
 * Search inventory by product name or barcode
 */
export async function searchInventory(
  searchTerm: string, 
  branchId?: string
): Promise<{ data: InventoryItem[] | null; error: string | null }> {
  try {
    let query = supabase
      .from('inventory')
      .select(`
        *,
        product:products(
          id,
          barcode,
          name_en,
          name_mm,
          image,
          base_price,
          is_active,
          category:categories(
            id,
            name_en,
            name_mm
          )
        ),
        branch:branches(
          id,
          name,
          location
        )
      `)
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    // Search in product name (both languages) and barcode
    query = query.or(`product.name_en.ilike.%${searchTerm}%,product.name_mm.ilike.%${searchTerm}%,product.barcode.ilike.%${searchTerm}%`)

    const { data, error } = await query

    if (error) throw error

    // Filter out inventory items with inactive or missing products
    const filteredData = (data || []).filter(item => 
      item.product && item.product.is_active === true
    )

    return { data: filteredData as InventoryItem[], error: null }
  } catch (err) {
    console.error('Error searching inventory:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Failed to search inventory' 
    }
  }
}