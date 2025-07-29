'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function AccessDeniedPage() {
  const { user } = useUser()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <span className="text-red-600 text-2xl">🚫</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you think this is an error.
          </p>

          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">Signed in as:</p>
              <p className="font-medium text-gray-900">{user.emailAddresses[0]?.emailAddress}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            
            <SignOutButton>
              <button 
                type="button"
                className="w-full bg-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </SignOutButton>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">ZawZaw Store POS System</p>
          </div>
        </div>
      </div>
    </div>
  )
}