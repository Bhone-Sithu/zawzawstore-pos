'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import InventoryManagement from '@/components/inventory/InventoryManagement'
import ProductsManagement from '@/components/products/ProductsManagement'
import { Users, Package, AlertTriangle, Store, UserCog, BarChart3, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'products' | 'users' | 'settings'>('dashboard')

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isLoaded || !user) return

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', user.id)
          .eq('is_active', true)
          .single()

        if (error || !userData || userData.role !== 'admin') {
          setIsAuthorized(false)
          router.push('/access-denied')
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Error checking permissions:', error)
        setIsAuthorized(false)
        router.push('/access-denied')
      }
    }

    checkPermissions()
  }, [user, isLoaded, router])

  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect to access-denied
  }

  const renderContent = () => {
    switch (currentView) {
      case 'inventory':
        return <InventoryManagement />
      case 'products':
        return <ProductsManagement />
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
            <p className="text-gray-600">User management functionality coming soon...</p>
          </div>
        )
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Settings</h2>
            <p className="text-gray-600">System settings functionality coming soon...</p>
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            {/* Dashboard Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
                        <dd className="text-lg font-medium text-gray-900">12</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Products</dt>
                        <dd className="text-lg font-medium text-gray-900">1,247</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                        <dd className="text-lg font-medium text-gray-900">23</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <Store className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Branches</dt>
                        <dd className="text-lg font-medium text-gray-900">3</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    type="button"
                    onClick={() => setCurrentView('users')}
                    className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                  >
                    <UserCog className="h-4 w-4 inline mr-2" />Manage Staff Accounts
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCurrentView('inventory')}
                    className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200"
                  >
                    <Package className="h-4 w-4 inline mr-2" />Manage Inventory
                  </button>
                  <button 
                    type="button"
                    className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200"
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />View Sales Reports
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCurrentView('settings')}
                    className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                  >
                    <Settings className="h-4 w-4 inline mr-2" />System Settings
                  </button>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                    <span className="text-sm text-gray-700">New staff member added to KL branch</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                    <span className="text-sm text-gray-700">Stock transfer completed: Rawang → Sungai Buloh</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3" />
                    <span className="text-sm text-gray-700">Low stock alert: Product ABC123</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">
                ZawZaw Store Admin
              </h1>
              
              {/* Navigation */}
              <nav className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('inventory')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'inventory'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('products')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'products'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('users')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'users'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('settings')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'settings'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.firstName}</span>
              <SignOutButton>
                <button 
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
