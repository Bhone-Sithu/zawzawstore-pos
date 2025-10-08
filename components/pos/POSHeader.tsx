'use client'

import { SignOutButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LogOut, Store, User } from 'lucide-react'

export default function POSHeader() {
  const { user } = useUser()
  
  const currentTime = new Date().toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const currentDate = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Store info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Grocery Store</h1>
                <p className="text-sm text-gray-500">Point of Sale</p>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Date & Time */}
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{currentTime}</p>
              <p className="text-xs text-gray-500">{currentDate}</p>
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {user?.firstName || 'Cashier'}
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Cashier
                </Badge>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <SignOutButton>
              <Button 
                variant="outline" 
                size="sm"
                className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  )
}