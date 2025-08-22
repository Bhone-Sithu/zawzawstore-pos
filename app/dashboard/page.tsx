'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Branch, UserRole } from '@/types/database.types'
import { UserCog, CreditCard, BarChart3, AlertCircle, MapPin, Store, Loader2, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [redirectCountdown, setRedirectCountdown] = useState(3)

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
        
        // Start countdown
        const countdown = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdown)
              // Auto-redirect based on role
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
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
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
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
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
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-xl bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm"
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

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          icon: UserCog,
          label: 'Administrator',
          color: 'orange',
          description: 'Full system access',
          destination: 'Admin Dashboard'
        }
      case 'cashier':
        return {
          icon: CreditCard,
          label: 'Cashier',
          color: 'green',
          description: 'Point of Sale operations',
          destination: 'POS Terminal'
        }
      case 'boss':
        return {
          icon: BarChart3,
          label: 'Management',
          color: 'blue',
          description: 'Reports and analytics',
          destination: 'Reports Dashboard'
        }
      default:
        return {
          icon: UserCog,
          label: 'User',
          color: 'gray',
          description: 'System access',
          destination: 'Dashboard'
        }
    }
  }

  const roleConfig = userRole ? getRoleConfig(userRole) : null
  const RoleIcon = roleConfig?.icon || UserCog

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 animate-slide-up">
          <div className="text-center">
            {/* Store Logo */}
            <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Store className="h-8 w-8 text-white" />
            </div>

            {/* Welcome Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600 text-lg mb-6">Hi {user.firstName || user.emailAddresses[0]?.emailAddress}</p>
            
            {/* Role Badge */}
            {roleConfig && (
              <div className={`
                mb-6 inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium gap-3
                ${roleConfig.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                ${roleConfig.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                ${roleConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                ${roleConfig.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                <RoleIcon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">{roleConfig.label}</div>
                  <div className="text-xs opacity-80">{roleConfig.description}</div>
                </div>
              </div>
            )}

            {/* Branch Info */}
            {userBranch && (
              <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center mb-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Assigned Branch</p>
                  <p className="font-bold text-gray-900 text-lg">{userBranch.name}</p>
                  <p className="text-gray-600">{userBranch.location}</p>
                </div>
              </div>
            )}

            {!userBranch && userRole !== 'boss' && (
              <div className="mb-6 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-800 font-medium">No branch assigned</p>
                <p className="text-yellow-600 text-sm">Contact your administrator</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard/sales')}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <BarChart3 className="h-5 w-5" />
                View Sales Dashboard
              </button>
              
              <button
                onClick={() => {
                  if (userRole) {
                    switch (userRole) {
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
                  }
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Go to {roleConfig?.destination}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">ZawZaw Store POS System</p>
        </div>
      </div>
    </div>
  )
}