'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, BarChart3, TrendingUp, Store, FileText, Mail } from 'lucide-react'

export default function ReportsDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

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

        if (error || !userData || userData.role !== 'boss') {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect to access-denied
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Grocery Store - Management Reports
              </h1>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">RM 45,280</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
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
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Growth</dt>
                      <dd className="text-lg font-medium text-gray-900">+12.5%</dd>
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
                      <Store className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Best Branch</dt>
                      <dd className="text-lg font-medium text-gray-900">KL</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Reports */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Reports</h3>
              <div className="space-y-3">
                <button 
                  type="button"
                  className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-green-900">Daily Sales Report</p>
                      <p className="text-sm text-green-600">Today&apos;s performance summary</p>
                    </div>
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                </button>
                
                <button 
                  type="button"
                  className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">Monthly Sales Report</p>
                      <p className="text-sm text-blue-600">This month&apos;s comprehensive data</p>
                    </div>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                </button>
                
                <button 
                  type="button"
                  className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-purple-900">Yearly Analysis</p>
                      <p className="text-sm text-purple-600">Annual performance insights</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </button>
              </div>
            </div>

            {/* Branch Performance */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Branch Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Grocery Store KL</p>
                    <p className="text-sm text-gray-900">Kuala Lumpur</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">RM 18,450</p>
                    <p className="text-sm text-gray-900">452 transactions</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Grocery Store Rawang</p>
                    <p className="text-sm text-gray-900">Rawang</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">RM 15,230</p>
                    <p className="text-sm text-gray-900">387 transactions</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Grocery Store Sungai Buloh</p>
                    <p className="text-sm text-gray-900">Sungai Buloh</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">RM 11,600</p>
                    <p className="text-sm text-gray-900">308 transactions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h3>
              <div className="space-y-3">
                <button 
                  type="button"
                  className="w-full flex items-center justify-center p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                
                <button 
                  type="button"
                  className="w-full flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
                
                <button 
                  type="button"
                  className="w-full flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </button>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">Top Selling Product</p>
                  <p className="text-xs text-yellow-600">Coca Cola 330ml - 156 units sold</p>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">Peak Hours</p>
                  <p className="text-xs text-blue-600">2:00 PM - 4:00 PM daily</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">Payment Method</p>
                  <p className="text-xs text-green-600">Cash: 65% | Card: 35%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}