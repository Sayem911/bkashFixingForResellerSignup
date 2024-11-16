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

  // Allow access to reseller registration flow pages without auth
  if (isResellerRegistrationFlow) {
    return NextResponse.next();
  }

  // Handle auth pages (signin, register)
  if (isAuthPage) {
    // If user is already logged in, redirect to appropriate dashboard
    if (isAuth) {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (token?.role === 'reseller') {
        return NextResponse.redirect(new URL('/reseller', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    return null;
  }

  // Protect authenticated routes
  if (!isAuth && (isAdminPage || isResellerPage || isProfilePage)) {
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
  if (isResellerPage) {
    if (token?.role !== 'reseller') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check if reseller is approved
    if (token?.status !== 'active') {
      // Allow access to pending page
      if (req.nextUrl.pathname === '/auth/reseller/register/pending') {
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