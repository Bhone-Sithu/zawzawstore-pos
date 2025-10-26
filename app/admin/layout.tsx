'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
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

  const isActivePage = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true
    if (path !== '/admin' && pathname.startsWith(path)) return true
    return false
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Grocery Store Admin</h1>
              <nav className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePage('/admin')
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/inventory')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePage('/admin/inventory')
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePage('/admin/products')
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/transactions')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePage('/admin/transactions')
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Transactions
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Settings
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <SignOutButton>
                <button 
                  type="button"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  Logout
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}