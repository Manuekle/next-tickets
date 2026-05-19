import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPage = pathname === '/about';
  const isAuthPage = pathname === '/login' || pathname === '/register' ||
    pathname === '/forgot-password' || pathname === '/reset-password';
  const hasAuthCookie = request.cookies.has('auth-storage');

  if (isPublicPage) return NextResponse.next();
  if (!isAuthPage && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuthPage && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
