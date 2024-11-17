import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isResellerPage = req.nextUrl.pathname.startsWith('/reseller');
  const isProfilePage = req.nextUrl.pathname.startsWith('/profile');

  // Special handling for reseller registration pages
  const isResellerRegistrationPage = req.nextUrl.pathname.startsWith('/auth/reseller/register');
  const isResellerRegistrationFlow = req.nextUrl.pathname.includes('/auth/reseller/register/');
  const isStoreSetupPage = req.nextUrl.pathname === '/auth/reseller/register/setup';
  const isPendingPage = req.nextUrl.pathname === '/auth/reseller/register/pending';

  // Allow access to reseller registration flow pages without auth
  if (isResellerRegistrationFlow && !isStoreSetupPage && !isPendingPage) {
    return NextResponse.next();
  }

  // Handle auth pages (signin, register)
  if (isAuthPage) {
    if (isAuth) {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (token?.role === 'reseller') {
        if (token.status === 'pending') {
          // If reseller is pending and tries to access any page except pending page,
          // redirect to pending page
          if (!isPendingPage) {
            return NextResponse.redirect(new URL('/auth/reseller/register/pending', req.url));
          }
          return NextResponse.next();
        }
        // If reseller is active, redirect to dashboard
        return NextResponse.redirect(new URL('/reseller', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    return null;
  }

  // Protect authenticated routes
  if (!isAuth && (isAdminPage || isResellerPage || isProfilePage || isStoreSetupPage)) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    // Redirect to appropriate login page
    if (isResellerPage) {
      return NextResponse.redirect(
        new URL(`/auth/reseller/signin?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Admin access check
  if (isAdminPage && token?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Reseller access check
  if (isResellerPage || isStoreSetupPage) {
    if (token?.role !== 'reseller') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Check if reseller is approved
    if (token?.status !== 'active') {
      // Allow access to pending page
      if (isPendingPage) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/auth/reseller/register/pending', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/reseller/:path*',
    '/auth/:path*',
    '/profile/:path*',
  ],
};