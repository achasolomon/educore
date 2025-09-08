
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Define paths that are considered public (accessible without token)
  const isPublicPath = path === '/auth/login' || path === '/auth/register' || path === '/auth/forgot-password' || path === '/';

  // Get the token from the cookies
  const token = request.cookies.get('auth-token')?.value || '';

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.nextUrl));
  }

  // Redirect to dashboard if accessing public route with valid token
  if (isPublicPath && token && path !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};