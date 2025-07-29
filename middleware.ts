import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserRole, hasPermission, getDefaultRoute } from '@/lib/auth-utils';

const isPublicRoute = createRouteMatcher(['/login', '/', '/access-denied']);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    
    if (!userId) {
      // Redirect to our custom login page instead of Clerk's
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based permissions for protected routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/pos') || pathname.startsWith('/reports')) {
      try {
        const userRole = await getUserRole(userId);
        
        if (!userRole) {
          // User not found in database
          const accessDeniedUrl = new URL('/access-denied', req.url);
          return NextResponse.redirect(accessDeniedUrl);
        }

        if (!hasPermission(userRole, pathname.split('/')[1] === 'admin' ? '/admin' : 
                                    pathname.split('/')[1] === 'pos' ? '/pos' : 
                                    pathname.split('/')[1] === 'reports' ? '/reports' : '')) {
          // User doesn't have permission for this route
          const defaultRoute = getDefaultRoute(userRole);
          const redirectUrl = new URL(defaultRoute, req.url);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        const accessDeniedUrl = new URL('/access-denied', req.url);
        return NextResponse.redirect(accessDeniedUrl);
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};