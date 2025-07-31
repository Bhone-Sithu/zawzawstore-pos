import { useState, useEffect } from 'react'
import { fetchCategories } from '@/services/product-service'
import type { Category } from '@/types/database.types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const data = await fetchCategories()
        setCategories(data)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
        setError(errorMessage)
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  return {
    categories,
    loading,
    error
  }
}