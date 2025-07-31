'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, Loader2, CheckCircle, UserCheck } from 'lucide-react'

export default function HomePage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const [checkingAccount, setCheckingAccount] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!isLoaded) return

      if (!isSignedIn) {
        router.push('/login')
        return
      }

      if (!user) return

      setCheckingAccount(true)
      setLoadingStep(1)

      try {
        // Check if user exists in Supabase
        const { data: existingUser } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', user.id)
          .eq('is_active', true)
          .single()

        setLoadingStep(2)
        
        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800))

        if (existingUser) {
          setLoadingStep(3)
          
          // Add another small delay before redirect
          await new Promise(resolve => setTimeout(resolve, 600))
          
          // User exists, redirect based on role
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
            default:
              router.push('/dashboard')
              break
          }
        } else {
          // User doesn't exist in database, redirect to access denied
          router.push('/access-denied')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/access-denied')
      }
    }

    checkUserAndRedirect()
  }, [isSignedIn, isLoaded, user, router])

  const loadingSteps = [
    { icon: Store, text: 'Loading ZawZaw Store...', subText: 'Initializing application' },
    { icon: UserCheck, text: 'Verifying account...', subText: 'Checking your credentials' },
    { icon: CheckCircle, text: 'Account verified!', subText: 'Redirecting to your dashboard' }
  ]

  const currentStep = checkingAccount ? loadingStep : 0
  const StepIcon = loadingSteps[currentStep]?.icon || Store

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-lg mx-auto">
        {/* Main Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-6 shadow-lg">
            <Store className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            ZawZaw Store
          </h1>
          <p className="text-xl text-gray-600">
            POS & Inventory Management
          </p>
        </div>

        {/* Loading Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-3 mb-6">
            {loadingSteps.map((_, index) => {
              const isActive = index <= currentStep
              const isCompleted = index < currentStep
              return (
                <div key={index} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                    ${isActive ? 'bg-orange-500 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  {index < loadingSteps.length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-2 transition-all duration-500
                      ${index < currentStep ? 'bg-orange-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Current Step */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {currentStep < 3 ? (
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              ) : (
                <StepIcon className="h-8 w-8 text-orange-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {loadingSteps[currentStep]?.text || 'Loading...'}
            </h3>
            <p className="text-gray-600 text-sm">
              {loadingSteps[currentStep]?.subText || 'Please wait...'}
            </p>
          </div>

          {/* Loading Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(currentStep + 1) * 33.33}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Secure • Reliable • Multi-Branch
          </p>
        </div>
      </div>
    </div>
  )
}