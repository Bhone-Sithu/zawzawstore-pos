'use client'

import { Users, Package, AlertTriangle, Store, UserCog, BarChart3, Settings } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'settings'>('dashboard')

  const renderContent = () => {
    switch (currentView) {
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
                    onClick={() => router.push('/admin/inventory')}
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

  return renderContent()
}
