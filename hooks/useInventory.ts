'use client'

import { useState, useEffect } from 'react'
import * as inventoryService from '@/services/inventory-service'
import type { InventoryItem, InventoryStats, InventoryHookResult } from '@/types/inventory.types'

export function useInventory(branchId?: string): InventoryHookResult {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await inventoryService.fetchInventory(branchId)

      if (fetchError) {
        setError(fetchError)
        return
      }

      if (data) {
        setInventory(data)
        const calculatedStats = inventoryService.calculateStats(data)
        setStats(calculatedStats)
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }

  const updateInventoryQuantity = async (inventoryId: string, newQuantity: number, notes?: string) => {
    const result = await inventoryService.updateInventoryQuantity(inventoryId, newQuantity, notes)
    
    if (result.success) {
      // Refresh inventory data
      await fetchInventory()
    }
    
    return result
  }

  const createInventoryRecord = async (productId: string, branchId: string, quantity: number, price?: number, expiryDate?: string) => {
    const result = await inventoryService.createInventoryRecord(productId, branchId, quantity, price, expiryDate)
    
    if (result.success) {
      // Refresh inventory data
      await fetchInventory()
    }
    
    return result
  }

  useEffect(() => {
    fetchInventory()
  }, [branchId])

  return {
    inventory,
    stats,
    loading,
    error,
    refetch: fetchInventory,
    updateQuantity: updateInventoryQuantity,
    createRecord: createInventoryRecord
  }
}