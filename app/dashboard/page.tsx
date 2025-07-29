'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Branch, UserRole } from '@/types/database.types'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [error, setError] = useState<string>('')

  const setupUserInSupabase = useCallback(async () => {
    if (!user) return

    try {
      // Check if user exists in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single()

      if (existingUser) {
        // User exists, get their role and redirect immediately
        setUserRole(existingUser.role)
        if (existingUser.branch_id) {
          setSelectedBranch(existingUser.branch_id)
        }
        
        // Auto-redirect based on role
        setTimeout(() => {
          switch (existingUser.role) {
            case 'admin':
              router.push('/admin')
              break
            case 'cashier':
              router.push('/pos')
              break
            case 'boss':
              router.push('/reports')
              break
          }
        }, 1000) // Small delay to show welcome message
        
      } else {
        // User doesn't exist, redirect to setup or show error
        setError('Account not found. Please contact your administrator.')
      }
    } catch (error) {
      console.error('Error setting up user:', error)
      setError('Failed to load user account. Please try again.')
    }
  }, [user, router])

  const fetchBranches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching branches:', error)
        return
      }

      setBranches(data || [])
      if (data && data.length > 0) {
        setSelectedBranch(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && user) {
      setupUserInSupabase()
      fetchBranches()
    }
  }, [isLoaded, user, setupUserInSupabase, fetchBranches])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get user's branch name for display
  const userBranch = branches.find(branch => branch.id === selectedBranch)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-900 mb-4">Hi {user.firstName}</p>
          
          <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {userRole === 'admin' && '👨‍💼 Administrator'}
            {userRole === 'cashier' && '💰 Cashier'}
            {userRole === 'boss' && '📊 Management'}
          </div>

          {userBranch && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">Assigned Branch</p>
              <p className="font-medium text-gray-900">{userBranch.name}</p>
              <p className="text-sm text-gray-900">{userBranch.location}</p>
            </div>
          )}

          {!userBranch && userRole !== 'boss' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">No branch assigned</p>
            </div>
          )}

          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="ml-3 text-gray-900">Redirecting to your dashboard...</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">ZawZaw Store POS System</p>
          </div>
        </div>
      </div>
    </div>
  )
}