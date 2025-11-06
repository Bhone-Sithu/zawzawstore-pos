import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types/database.types'

export interface CreateSupplierData {
  name: string
  phone?: string
  email?: string
  address?: string
  contact_person?: string
  notes?: string
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  is_active?: boolean
}

export interface SuppliersResult {
  suppliers: Supplier[]
  totalCount: number
  totalPages: number
}

export class SupplierService {
  // Get all suppliers with pagination and search
  static async getSuppliers(
    page: number = 1,
    itemsPerPage: number = 10,
    searchTerm?: string,
    activeOnly: boolean = true
  ): Promise<SuppliersResult> {
    try {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })

      // Filter by active status
      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        const search = searchTerm.trim()
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,contact_person.ilike.%${search}%`)
      }

      // Apply pagination
      const offset = (page - 1) * itemsPerPage
      query = query.range(offset, offset + itemsPerPage - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching suppliers:', error)
        throw new Error(`Failed to fetch suppliers: ${error.message}`)
      }

      const totalPages = Math.ceil((count || 0) / itemsPerPage)

      return {
        suppliers: data || [],
        totalCount: count || 0,
        totalPages
      }
    } catch (error) {
      console.error('Error in getSuppliers:', error)
      throw error
    }
  }

  // Get supplier by ID
  static async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Supplier not found
        }
        console.error('Error fetching supplier:', error)
        throw new Error(`Failed to fetch supplier: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in getSupplierById:', error)
      throw error
    }
  }

  // Create new supplier
  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          ...supplierData,
          is_active: true
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating supplier:', error)
        throw new Error(`Failed to create supplier: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in createSupplier:', error)
      throw error
    }
  }

  // Update supplier
  static async updateSupplier(id: string, supplierData: UpdateSupplierData): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...supplierData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating supplier:', error)
        throw new Error(`Failed to update supplier: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in updateSupplier:', error)
      throw error
    }
  }

  // Delete supplier (soft delete - set is_active to false)
  static async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting supplier:', error)
        throw new Error(`Failed to delete supplier: ${error.message}`)
      }
    } catch (error) {
      console.error('Error in deleteSupplier:', error)
      throw error
    }
  }

  // Reactivate supplier
  static async reactivateSupplier(id: string): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error reactivating supplier:', error)
        throw new Error(`Failed to reactivate supplier: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error in reactivateSupplier:', error)
      throw error
    }
  }

  // Get all active suppliers (for dropdowns)
  static async getActiveSuppliers(): Promise<Pick<Supplier, 'id' | 'name' | 'phone' | 'contact_person'>[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, phone, contact_person')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching active suppliers:', error)
        throw new Error(`Failed to fetch active suppliers: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in getActiveSuppliers:', error)
      throw error
    }
  }

  // Search suppliers by name (for autocomplete)
  static async searchSuppliersByName(searchTerm: string, limit = 10): Promise<Pick<Supplier, 'id' | 'name' | 'phone' | 'contact_person'>[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, phone, contact_person')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error searching suppliers:', error)
        throw new Error(`Failed to search suppliers: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error in searchSuppliersByName:', error)
      throw error
    }
  }
}