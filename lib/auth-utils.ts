import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database.types'

export async function getUserRole(clerkId: string): Promise<UserRole | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', clerkId)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return null
    }

    return user.role
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

export const ROLE_PERMISSIONS = {
  admin: ['/admin', '/dashboard'],
  cashier: ['/pos', '/dashboard'],
  boss: ['/reports', '/dashboard']
} as const

export function hasPermission(userRole: UserRole, path: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(path) || false
}

export function getDefaultRoute(userRole: UserRole): string {
  switch (userRole) {
    case 'admin':
      return '/admin'
    case 'cashier':
      return '/pos'
    case 'boss':
      return '/reports'
    default:
      return '/login'
  }
}