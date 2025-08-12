import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAuth(requiredRole: 'admin' | 'cashier' | 'boss') {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isLoaded || !user) return

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, branch_id')
          .eq('clerk_id', user.id)
          .eq('is_active', true)
          .single()

        if (error || !userData || userData.role !== requiredRole) {
          setIsAuthorized(false)
          router.push('/access-denied')
          return
        }

        setIsAuthorized(true)
        setBranchId(userData.branch_id)
        setUserRole(userData.role)
      } catch (error) {
        console.error('Error checking permissions:', error)
        setIsAuthorized(false)
        router.push('/access-denied')
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [user, isLoaded, router, requiredRole])

  return {
    isAuthorized,
    isLoading: !isLoaded || isLoading,
    user,
    branchId,
    userRole
  }
}