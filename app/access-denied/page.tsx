'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { ShieldX, User, Copy, LogOut, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function AccessDeniedPage() {
  const { user } = useUser()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 animate-slide-up">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-xl bg-red-100 mb-6">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Account Not Found</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your account is not registered in the ZawZaw Store POS system. Please contact your administrator to set up your account.
            </p>

            {/* User Info Card */}
            {user && (
              <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900">{user.emailAddresses[0]?.emailAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">User ID</p>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                      <code className="text-sm font-mono text-gray-700 flex-1">{user.id}</code>
                      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                      <button
                        onClick={() => copyToClipboard(user.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy User ID"
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-600 mt-1 animate-fade-in">User ID copied to clipboard!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Instructions */}
            <div className="mb-6 p-6 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold text-orange-900 mb-2">For Administrators</p>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    Add this user to your Supabase database using the User ID above. Make sure to assign the appropriate role and branch access.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <SignOutButton>
                <button 
                  type="button"
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out & Try Different Account
                </button>
              </SignOutButton>

              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
<button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            ZawZaw Store POS System • Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}